import { buildSchluesselLoginUrl } from '../lib/authRedirect'

/**
 * Computes the expected URL directly from the behavioral spec:
 *
 *   base = {VITE_SCHLUSSEL_URL or 'http://localhost:4001'}
 *   returnTo = `${origin}/auth/callback?next=${encodeURIComponent(currentPath)}`
 *   result = `${base}/login?return_to=${encodeURIComponent(returnTo)}`
 */
function expectedUrl(base: string, origin: string, currentPath: string): string {
  const returnTo = `${origin}/auth/callback?next=${encodeURIComponent(currentPath)}`
  return `${base}/login?return_to=${encodeURIComponent(returnTo)}`
}

describe('buildSchluesselLoginUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('falls back to http://localhost:4001 when VITE_SCHLUSSEL_URL is unset', () => {
    // Sanity: confirm the env var really is unset in this test environment.
    expect(import.meta.env.VITE_SCHLUSSEL_URL).toBeUndefined()

    const result = buildSchluesselLoginUrl('/dashboard')
    expect(result).toBe(expectedUrl('http://localhost:4001', window.location.origin, '/dashboard'))
  })

  it('uses window.location.origin as the default origin when the second arg is omitted', () => {
    const result = buildSchluesselLoginUrl('/settings')
    const returnTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent('/settings')}`
    expect(result).toContain(encodeURIComponent(returnTo))
  })

  it('uses the explicitly-provided origin instead of window.location.origin when given', () => {
    const result = buildSchluesselLoginUrl('/settings', 'https://custom.example.org')
    expect(result).toBe(expectedUrl('http://localhost:4001', 'https://custom.example.org', '/settings'))
    // Must differ from the default-origin call since the origins differ.
    expect(result).not.toBe(buildSchluesselLoginUrl('/settings'))
  })

  it('reads VITE_SCHLUSSEL_URL from the environment when set', () => {
    vi.stubEnv('VITE_SCHLUSSEL_URL', 'https://schluessel.example.com')
    const result = buildSchluesselLoginUrl('/', 'https://app.example.com')
    expect(result).toBe(expectedUrl('https://schluessel.example.com', 'https://app.example.com', '/'))
    expect(result.startsWith('https://schluessel.example.com/login?return_to=')).toBe(true)
  })

  it('url-encodes special characters in currentPath (query params, spaces, unicode)', () => {
    const path = '/settings?tab=profile&x=1 2#frag'
    const result = buildSchluesselLoginUrl(path, 'https://app.example.com')
    expect(result).toBe(expectedUrl('http://localhost:4001', 'https://app.example.com', path))
  })

  it('handles the root path "/"', () => {
    const result = buildSchluesselLoginUrl('/', 'https://app.example.com')
    expect(result).toBe(expectedUrl('http://localhost:4001', 'https://app.example.com', '/'))
  })

  it('handles an empty-string currentPath', () => {
    const result = buildSchluesselLoginUrl('', 'https://app.example.com')
    expect(result).toBe(expectedUrl('http://localhost:4001', 'https://app.example.com', ''))
  })

  it('double-encodes correctly: the inner next value is percent-encoded once, then the whole return_to is percent-encoded again', () => {
    const path = '/a/b?c=d'
    const result = buildSchluesselLoginUrl(path, 'https://app.example.com')

    // Reconstruct manually, step by step, and confirm exact match.
    const innerNext = encodeURIComponent(path) // "%2Fa%2Fb%3Fc%3Dd"
    const returnTo = `https://app.example.com/auth/callback?next=${innerNext}`
    const outerReturnTo = encodeURIComponent(returnTo)
    expect(result).toBe(`http://localhost:4001/login?return_to=${outerReturnTo}`)

    // Sanity check: the result should NOT contain a literal, unescaped '?' or '&'
    // from the return_to portion (they must all have been percent-encoded away).
    const queryPart = result.split('?return_to=')[1]
    expect(queryPart).not.toContain('?')
    expect(queryPart).not.toContain('&')
  })

  it('is a pure function: same inputs produce the same output on repeated calls', () => {
    const a = buildSchluesselLoginUrl('/x', 'https://app.example.com')
    const b = buildSchluesselLoginUrl('/x', 'https://app.example.com')
    expect(a).toBe(b)
  })

  it('produces a result containing "/login?return_to=" regardless of inputs', () => {
    const result = buildSchluesselLoginUrl('/anything', 'https://app.example.com')
    expect(result).toContain('/login?return_to=')
  })
})
