# Security Policy

## Supported versions

Schloss is deployed continuously from `main` — there are no maintained
release branches. Security fixes land on `main` and that is the only
supported version.

## Reporting a vulnerability

Please do not open a public issue for security vulnerabilities. Instead,
use GitHub's private reporting flow:

1. Go to the [Security tab](../../security) of this repository.
2. Click "Report a vulnerability".
3. Describe the issue, including reproduction steps if you have them.

This is a small, mostly-solo project, so response time is best-effort, not
contractual — but you can expect an initial reply within a few days.

## Scope

Schloss holds no user data itself beyond the access token kept in memory
and a PKCE code verifier kept in `sessionStorage` for the duration of a
login redirect. In scope: anything that could leak either of those (XSS,
an unsafe redirect target), the `return_to`/PKCE guard on the auth
handoff, and anything that would let an unauthenticated visitor reach a
protected page.
