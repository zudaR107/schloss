import { render, cleanup, waitFor } from '@testing-library/react'
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
// vi.mock factories are hoisted above imports, so any variables they close
// over must themselves be created via vi.hoisted().
const { setAccessTokenMock, setUserMock, navigateMock } = vi.hoisted(() => ({
  setAccessTokenMock: vi.fn(),
  setUserMock: vi.fn(),
  navigateMock: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  setAccessToken: setAccessTokenMock,
  getAccessToken: vi.fn(() => null),
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    logout: vi.fn(),
    setUser: setUserMock,
  }),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function navigateTo(url: string) {
  window.history.pushState(null, '', url)
}

function okJsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response
}

function notOkResponse(status = 401) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ error: 'unauthorized' }),
  } as Response
}

// We don't know the exact sessionStorage key the implementation reads the
// PKCE verifier under (reading the source is off-limits). To simulate "a
// verifier is present" robustly without guessing the one true key name, we
// seed every plausible key with a marker value before rendering. Whichever
// key the implementation actually reads, it will find a value there.
const PLAUSIBLE_VERIFIER_KEYS = [
  'pkce_code_verifier',
  'code_verifier',
  'pkce_verifier',
  'pkceCodeVerifier',
  'codeVerifier',
  'pkceVerifier',
  'auth_code_verifier',
  'schloss_pkce_code_verifier',
  'schloss_code_verifier',
]

function seedPlausibleVerifiers(value = 'test-verifier-value') {
  for (const key of PLAUSIBLE_VERIFIER_KEYS) {
    sessionStorage.setItem(key, value)
  }
}

const sampleUser = { id: '1', email: 'anna@example.com', name: 'Anna', role: 'user' as const }

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    setAccessTokenMock.mockClear()
    setUserMock.mockClear()
    navigateMock.mockClear()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    window.history.pushState(null, '', '/')
    sessionStorage.clear()
  })

  it('navigates to "/" immediately, without touching setAccessToken or fetch, when there is no code and no next param', async () => {
    navigateTo('/auth/callback')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/', replace: true })
    })
    expect(setAccessTokenMock).not.toHaveBeenCalled()
    expect(setUserMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('navigates to the decoded "next" query param when there is no code', async () => {
    navigateTo('/auth/callback?next=%2Ffoo%2Fbar')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/foo/bar', replace: true })
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('strips the URL down to just the pathname even when there is no code', async () => {
    navigateTo('/auth/callback?next=%2Ffoo')
    vi.stubGlobal('fetch', vi.fn())

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled()
    })
    expect(window.location.hash).toBe('')
    expect(window.location.search).toBe('')
    expect(window.location.pathname).toBe('/auth/callback')
  })

  it('strips the code from the URL synchronously, before the /auth/token fetch resolves', async () => {
    seedPlausibleVerifiers()
    navigateTo('/auth/callback?code=abc123')
    const { promise, resolve } = deferred<Response>()
    const fetchMock = vi.fn(() => promise)
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthCallbackPage />)

    // Synchronously (before we await/flush anything), the query string must
    // already be gone (history.replaceState happens up front).
    expect(window.location.hash).toBe('')
    expect(window.location.search).toBe('')

    // setAccessToken must NOT have been called yet: unlike the old
    // fragment-token flow, the token is only known after the POST resolves.
    expect(setAccessTokenMock).not.toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()

    resolve(okJsonResponse({ accessToken: 'real-token-abc', user: sampleUser }))
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/', replace: true })
    })
    expect(setAccessTokenMock).toHaveBeenCalledWith('real-token-abc')
    expect(setUserMock).toHaveBeenCalledWith(sampleUser)
  })

  it('exchanges the code for a token via POST /auth/token with the code and verifier in the body', async () => {
    seedPlausibleVerifiers('my-test-verifier')
    navigateTo('/auth/callback?code=the-code-value')
    const fetchMock = vi.fn().mockResolvedValue(okJsonResponse({ accessToken: 'tok', user: sampleUser }))
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/auth/token')
    expect(init).toMatchObject({ method: 'POST' })

    const body = JSON.parse(init.body)
    expect(body.code).toBe('the-code-value')
    // The verifier value should be present somewhere in the body (under
    // whatever key the implementation uses).
    expect(Object.values(body)).toContain('my-test-verifier')

    // No separate /auth/me call should ever be made in the new flow.
    expect(fetchMock).not.toHaveBeenCalledWith('/auth/me', expect.anything())
  })

  it('calls setUser with the parsed JSON and then navigates to the custom "next" path on success', async () => {
    seedPlausibleVerifiers()
    navigateTo('/auth/callback?next=%2Fdashboard&code=xyz789')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJsonResponse({ accessToken: 'tok', user: sampleUser })))

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(setUserMock).toHaveBeenCalledWith(sampleUser)
    })
    expect(setAccessTokenMock).toHaveBeenCalledWith('tok')
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/dashboard', replace: true })
    })
  })

  it('does not call setAccessToken/setUser and still navigates when /auth/token responds non-ok', async () => {
    seedPlausibleVerifiers()
    navigateTo('/auth/callback?code=badcode')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(notOkResponse(401)))

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/', replace: true })
    })
    expect(setAccessTokenMock).not.toHaveBeenCalled()
    expect(setUserMock).not.toHaveBeenCalled()
  })

  it('swallows a rejected /auth/token fetch without crashing, and still navigates away', async () => {
    seedPlausibleVerifiers()
    navigateTo('/auth/callback?next=%2Fhome&code=willfail')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    expect(() => render(<AuthCallbackPage />)).not.toThrow()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/home', replace: true })
    })
    expect(setAccessTokenMock).not.toHaveBeenCalled()
    expect(setUserMock).not.toHaveBeenCalled()
  })

  it('still calls setAccessToken exactly once even though navigation is deferred until settle', async () => {
    seedPlausibleVerifiers()
    navigateTo('/auth/callback?code=onlyonce')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJsonResponse({ accessToken: 'only-once-token', user: sampleUser })))

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled()
    })
    expect(setAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(setAccessTokenMock).toHaveBeenCalledWith('only-once-token')
  })

  it('treats a code param with no stored verifier the same as "no code": no fetch, no setAccessToken/setUser, just navigate', async () => {
    // sessionStorage is cleared in beforeEach and we deliberately do NOT seed it.
    navigateTo('/auth/callback?next=%2Fsomewhere&code=orphan-code')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/somewhere', replace: true })
    })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(setAccessTokenMock).not.toHaveBeenCalled()
    expect(setUserMock).not.toHaveBeenCalled()
  })

  it('clears the stored verifier (single-use) after a successful exchange', async () => {
    const marker = 'test-verifier-value'
    seedPlausibleVerifiers(marker)
    navigateTo('/auth/callback?code=consume-me')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJsonResponse({ accessToken: 'tok', user: sampleUser })))

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled()
    })

    // We don't know which of the plausible keys the implementation actually
    // reads its verifier from, so we can't assert every seeded key is gone
    // (clearing the real key leaves the other, irrelevant, seeded keys
    // untouched). Instead assert that AT LEAST ONE previously-seeded key no
    // longer holds the marker value -- proving whichever key was really used
    // got cleared after being read (single-use).
    const stillPresentCount = PLAUSIBLE_VERIFIER_KEYS.filter(
      (key) => sessionStorage.getItem(key) === marker,
    ).length
    expect(stillPresentCount).toBeLessThan(PLAUSIBLE_VERIFIER_KEYS.length)
  })
})
