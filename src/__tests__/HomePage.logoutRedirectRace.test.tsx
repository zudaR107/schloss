// Regression test for a real bug: HomePage's login-redirect effect watches
// [loading, user] and sends the browser to schlussel's LOGIN page whenever
// `!loading && !user`. The logout button calls the REAL logout() (which
// asynchronously clears `user` to null) and then navigates to schlussel's
// LOGOUT page. Clearing `user` to null during a deliberate logout also
// satisfies the login-redirect effect's condition, so both navigations used
// to race - the login redirect could fire and win, undoing the logout.
//
// This file intentionally does NOT mock '../hooks/useAuth' (unlike
// HomePage.test.tsx), so HomePage is wired to the REAL useAuthProvider /
// AuthContext and a REAL transition of `user` from a real value to `null`
// via a real logout() call - exactly what's needed to exercise the race.
// It lives in its own file (rather than appended to HomePage.test.tsx)
// because HomePage.test.tsx module-mocks '../hooks/useAuth' entirely and
// relies on the REAL buildSchluesselLoginUrl in one of its own tests, both
// of which would conflict with what this test needs.
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomePage from '../pages/HomePage'
import { AuthContext, useAuthProvider } from '../hooks/useAuth'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const { buildLoginMock, buildLogoutMock, MOCK_LOGIN_URL, MOCK_LOGOUT_URL } = vi.hoisted(() => ({
  MOCK_LOGIN_URL: 'https://schlussel.example.test/login?mock=login',
  MOCK_LOGOUT_URL: 'https://schlussel.example.test/logout?mock=logout',
  buildLoginMock: vi.fn(),
  buildLogoutMock: vi.fn(),
}))

vi.mock('../lib/authRedirect', () => ({
  buildSchluesselLoginUrl: buildLoginMock,
  buildSchluesselLogoutUrl: buildLogoutMock,
}))

const sampleUser = { id: '1', email: 'anna@example.com', name: 'Анна', role: 'user' as const }

function okJsonResponse(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) } as Response
}

function notFoundResponse() {
  return { ok: false, status: 404, json: () => Promise.resolve({}) } as Response
}

// /auth/refresh + /auth/me resolve to a real logged-in user so HomePage
// renders its main content (not the login-redirect branch) on mount.
// /auth/logout resolves successfully but after a short delay - this widens
// the window between logout()'s `setUser(null)` and the logout navigation,
// which is exactly the window in which the login-redirect effect used to be
// able to race in and win before the fix.
function makeFetchMock() {
  return vi.fn((url: RequestInfo | URL, _init?: RequestInit) => {
    const u = String(url)
    if (u.includes('/auth/refresh')) {
      return Promise.resolve(okJsonResponse({ accessToken: 'tok-123' }))
    }
    if (u.includes('/auth/me')) {
      return Promise.resolve(okJsonResponse(sampleUser))
    }
    if (u.includes('/auth/logout')) {
      return new Promise<Response>((resolve) => {
        setTimeout(() => resolve(okJsonResponse({})), 10)
      })
    }
    return Promise.resolve(notFoundResponse())
  })
}

// Wires HomePage to the REAL useAuthProvider() via the REAL AuthContext,
// mirroring how the app itself provides auth (see App/main entry point),
// instead of HomePage.test.tsx's mocked useAuth().
function AuthedHomePage() {
  const auth = useAuthProvider()
  return (
    <AuthContext.Provider value={auth}>
      <HomePage />
    </AuthContext.Provider>
  )
}

let originalLocation: Location

describe('HomePage - logout vs. login-redirect race (regression)', () => {
  beforeEach(() => {
    buildLoginMock.mockReset().mockResolvedValue(MOCK_LOGIN_URL)
    buildLogoutMock.mockReset().mockReturnValue(MOCK_LOGOUT_URL)

    originalLocation = window.location
    // @ts-expect-error -- intentionally deleting to stub location for the test
    delete window.location
    // @ts-expect-error -- plain writable stand-in object
    window.location = { ...originalLocation, href: originalLocation.href }
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    // @ts-expect-error -- restore the real Location object
    window.location = originalLocation
  })

  it('ends up on the Schlüssel LOGOUT url (not the LOGIN url) after clicking "Выйти", despite logout() transiently clearing user to null', async () => {
    vi.stubGlobal('fetch', makeFetchMock())

    const user = userEvent.setup()
    render(<AuthedHomePage />)

    // Wait for the real on-mount refresh+me chain to resolve into a logged-in
    // render (not the login-redirect branch).
    const logoutButton = await screen.findByRole('button', { name: /Выйти/ })

    await user.click(logoutButton)

    // Let the logout flow (delayed /auth/logout fetch, setUser(null), and
    // the logout navigation) fully settle.
    await waitFor(() => {
      expect(window.location.href).toBe(MOCK_LOGOUT_URL)
    })

    // The actual regression check: the login-redirect effect's URL must
    // never have won the race and ended up assigned instead.
    expect(window.location.href).not.toBe(MOCK_LOGIN_URL)
  })
})
