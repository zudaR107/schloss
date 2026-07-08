// Schloss has no login form of its own — signing in sends the browser to
// schlussel's hosted login page via a full navigation. schlussel redirects
// back to return_to with the token in the URL fragment once the user has
// signed in; /auth/callback picks it up from there.
const DEFAULT_SCHLUSSEL_URL = 'http://localhost:4001'

export function buildSchluesselLoginUrl(currentPath: string, origin: string = window.location.origin): string {
  const schluesselUrl = import.meta.env.VITE_SCHLUSSEL_URL ?? DEFAULT_SCHLUSSEL_URL
  const returnTo = `${origin}/auth/callback?next=${encodeURIComponent(currentPath)}`
  return `${schluesselUrl}/login?return_to=${encodeURIComponent(returnTo)}`
}
