import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomePage from '../pages/HomePage'
import { buildSchluesselLoginUrl } from '../lib/authRedirect'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('../hooks/useAuth', () => ({
  useAuth: useAuthMock,
}))

const sampleUser = { id: '1', email: 'anna@example.com', name: 'Анна', role: 'user' as const }

let originalLocation: Location

describe('HomePage', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
    originalLocation = window.location
    // @ts-expect-error -- intentionally deleting to stub location for the test
    delete window.location
    // @ts-expect-error -- plain writable stand-in object
    window.location = { ...originalLocation, href: originalLocation.href }
  })

  afterEach(() => {
    cleanup()
    // @ts-expect-error -- restore the real Location object
    window.location = originalLocation
  })

  // -------------------------------------------------------------------------
  // Helper to assert nothing renders
  // -------------------------------------------------------------------------
  function expectNoPageContent() {
    expect(screen.queryByRole('button', { name: /Войти/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Выйти/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Добрый день/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Kuvert/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Скоро появятся новые сервисы')).not.toBeInTheDocument()
  }

  // -------------------------------------------------------------------------
  // Loading state: nothing should render, regardless of user
  // -------------------------------------------------------------------------
  it('renders no page content while loading is true (user null)', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    expectNoPageContent()
  })

  it('renders no page content while loading is true (user set)', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: true, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    expectNoPageContent()
  })

  // -------------------------------------------------------------------------
  // Logged out, not loading: nothing renders, and it redirects to login
  // -------------------------------------------------------------------------
  it('renders no page content when not loading and user is null', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    expectNoPageContent()
  })

  it('redirects to buildSchluesselLoginUrl(\'/\') automatically when not loading and user is null', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, logout: vi.fn(), setUser: vi.fn() })
    const expectedHref = buildSchluesselLoginUrl('/')

    render(<HomePage />)

    await waitFor(() => {
      expect(window.location.href).toBe(expectedHref)
    })
  })

  // -------------------------------------------------------------------------
  // Logged in, not loading: full page renders, no redirect happens
  // -------------------------------------------------------------------------
  it('greets with "Добрый день, {name}" when not loading and user is set', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: false, logout: vi.fn(), setUser: vi.fn() })
    const { container } = render(<HomePage />)
    expect(container.textContent).toContain('Добрый день, Анна')
  })

  it('shows the user\'s name and a "Выйти"-named button, and no "Войти" button, when not loading and user is set', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: false, logout: vi.fn(), setUser: vi.fn() })
    const { container } = render(<HomePage />)
    expect(container.textContent).toContain('Анна')
    expect(screen.getByRole('button', { name: /Выйти/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Войти/ })).not.toBeInTheDocument()
  })

  it('clicking "Выйти" calls logout()', async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ user: sampleUser, loading: false, logout: logoutMock, setUser: vi.fn() })
    const user = userEvent.setup()
    render(<HomePage />)

    await user.click(screen.getByRole('button', { name: /Выйти/ }))

    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('renders a clickable "Kuvert" link when not loading and user is set', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: false, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    const kuvertLink = screen.getByRole('link', { name: /Kuvert/ })
    expect(kuvertLink).toBeInTheDocument()
  })

  it('renders the "coming soon" placeholder card with the exact text when not loading and user is set', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: false, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    expect(screen.getByText('Скоро появятся новые сервисы')).toBeInTheDocument()
  })

  it('does not redirect to the login URL when not loading and user is set', async () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: false, logout: vi.fn(), setUser: vi.fn() })
    const loginUrl = buildSchluesselLoginUrl('/')
    const originalHref = window.location.href

    render(<HomePage />)

    // give any stray effect a tick to (incorrectly) fire before asserting
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(window.location.href).not.toBe(loginUrl)
    expect(window.location.href).toBe(originalHref)
  })
})
