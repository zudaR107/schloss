import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { setAccessToken } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import type { AuthUser } from '../../hooks/useAuth'

// Landed on after schlussel's hosted login redirects back with
// `#token=...`. Pulls the token out of the fragment, strips it from the
// URL/history immediately, fetches /auth/me to populate the user in
// context, then hands off to the originally-requested page (default '/')
// via a client-side navigation — a full reload here would wipe the
// just-set access token, which lives only in memory.
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const token = hashParams.get('token')
    const next = new URLSearchParams(window.location.search).get('next') ?? '/'
    history.replaceState(null, '', window.location.pathname)

    if (!token) {
      navigate({ to: next, replace: true })
      return
    }

    setAccessToken(token)
    fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() as Promise<AuthUser> : null))
      .then((user) => { if (user) setUser(user) })
      .catch(() => {})
      .finally(() => navigate({ to: next, replace: true }))
  }, [navigate, setUser])

  return null
}
