import { render, screen, cleanup } from '@testing-library/react'
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
  // Greeting
  // -------------------------------------------------------------------------
  it('greets with just "Добрый день" (no name) when user is null', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, logout: vi.fn(), setUser: vi.fn() })
    const { container } = render(<HomePage />)
    expect(container.textContent).toMatch(/Добрый день(?!,)/)
  })

  it('greets with "Добрый день, {name}" when user is set', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: false, logout: vi.fn(), setUser: vi.fn() })
    const { container } = render(<HomePage />)
    expect(container.textContent).toContain('Добрый день, Анна')
  })

  it('greeting reflects the user regardless of loading state', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: true, logout: vi.fn(), setUser: vi.fn() })
    const { container } = render(<HomePage />)
    expect(container.textContent).toContain('Добрый день, Анна')
  })

  // -------------------------------------------------------------------------
  // Loading state: no auth buttons should flash
  // -------------------------------------------------------------------------
  it('renders neither a "Войти" nor a "Выйти" button while loading is true (user null)', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    expect(screen.queryByRole('button', { name: /Войти/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Выйти/ })).not.toBeInTheDocument()
  })

  it('renders neither a "Войти" nor a "Выйти" button while loading is true (user set)', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: true, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    expect(screen.queryByRole('button', { name: /Войти/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Выйти/ })).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Logged out, not loading
  // -------------------------------------------------------------------------
  it('shows a "Войти" button (exact accessible name) when not loading and user is null', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Выйти/ })).not.toBeInTheDocument()
  })

  it('clicking "Войти" sets window.location.href to buildSchluesselLoginUrl(\'/\')', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, logout: vi.fn(), setUser: vi.fn() })
    const user = userEvent.setup()
    render(<HomePage />)

    const expectedHref = buildSchluesselLoginUrl('/')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(window.location.href).toBe(expectedHref)
  })

  // -------------------------------------------------------------------------
  // Logged in, not loading
  // -------------------------------------------------------------------------
  it('shows the user\'s name and a "Выйти"-named button when not loading and user is set', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: false, logout: vi.fn(), setUser: vi.fn() })
    const { container } = render(<HomePage />)
    expect(container.textContent).toContain('Анна')
    expect(screen.getByRole('button', { name: /Выйти/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Войти' })).not.toBeInTheDocument()
  })

  it('clicking "Выйти" calls logout()', async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ user: sampleUser, loading: false, logout: logoutMock, setUser: vi.fn() })
    const user = userEvent.setup()
    render(<HomePage />)

    await user.click(screen.getByRole('button', { name: /Выйти/ }))

    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  // -------------------------------------------------------------------------
  // Static content: service cards
  // -------------------------------------------------------------------------
  it('renders a clickable "Kuvert" link', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    const kuvertLink = screen.getByRole('link', { name: /Kuvert/ })
    expect(kuvertLink).toBeInTheDocument()
  })

  it('renders the "coming soon" placeholder card with the exact text', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    expect(screen.getByText('Скоро появятся новые сервисы')).toBeInTheDocument()
  })

  it('renders service cards regardless of auth/loading state', () => {
    useAuthMock.mockReturnValue({ user: sampleUser, loading: true, logout: vi.fn(), setUser: vi.fn() })
    render(<HomePage />)
    expect(screen.getByRole('link', { name: /Kuvert/ })).toBeInTheDocument()
    expect(screen.getByText('Скоро появятся новые сервисы')).toBeInTheDocument()
  })
})
