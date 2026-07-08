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

const sampleUser = { id: '1', email: 'anna@example.com', name: 'Anna', role: 'user' as const }

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    setAccessTokenMock.mockClear()
    setUserMock.mockClear()
    navigateMock.mockClear()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    window.history.pushState(null, '', '/')
  })

  it('navigates to "/" immediately, without touching setAccessToken or fetch, when there is no token and no next param', async () => {
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

  it('navigates to the decoded "next" query param when there is no token', async () => {
    navigateTo('/auth/callback?next=%2Ffoo%2Fbar')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/foo/bar', replace: true })
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('strips the URL down to just the pathname even when there is no token', async () => {
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

  it('when a token is present: strips it from the URL synchronously, before the /auth/me fetch resolves', async () => {
    navigateTo('/auth/callback#token=abc.def.ghi')
    const { promise, resolve } = deferred<Response>()
    const fetchMock = vi.fn(() => promise)
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthCallbackPage />)

    // Synchronously (before we await/flush anything), the hash must already
    // be gone and setAccessToken must already have been called.
    expect(window.location.hash).toBe('')
    expect(window.location.search).toBe('')
    expect(setAccessTokenMock).toHaveBeenCalledWith('abc.def.ghi')
    expect(fetchMock).toHaveBeenCalledWith('/auth/me', {
      headers: { Authorization: 'Bearer abc.def.ghi' },
    })
    // Navigation must NOT have happened yet: the /auth/me attempt hasn't settled.
    expect(navigateMock).not.toHaveBeenCalled()

    resolve(okJsonResponse(sampleUser))
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/', replace: true })
    })
    expect(setUserMock).toHaveBeenCalledWith(sampleUser)
  })

  it('calls setUser with the parsed JSON and then navigates to the custom "next" path on success', async () => {
    navigateTo('/auth/callback?next=%2Fdashboard#token=xyz789')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJsonResponse(sampleUser)))

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(setUserMock).toHaveBeenCalledWith(sampleUser)
    })
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/dashboard', replace: true })
    })
  })

  it('does not call setUser and still navigates when /auth/me responds non-ok', async () => {
    navigateTo('/auth/callback#token=badtoken')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(notOkResponse(401)))

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/', replace: true })
    })
    expect(setUserMock).not.toHaveBeenCalled()
  })

  it('swallows a rejected /auth/me fetch without crashing, and still navigates away', async () => {
    navigateTo('/auth/callback?next=%2Fhome#token=willfail')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    expect(() => render(<AuthCallbackPage />)).not.toThrow()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/home', replace: true })
    })
    expect(setUserMock).not.toHaveBeenCalled()
  })

  it('still calls setAccessToken exactly once even though navigation is deferred until settle', async () => {
    navigateTo('/auth/callback#token=onlyonce')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJsonResponse(sampleUser)))

    render(<AuthCallbackPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalled()
    })
    expect(setAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(setAccessTokenMock).toHaveBeenCalledWith('onlyonce')
  })
})
