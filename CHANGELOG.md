# Changelog

Brief log of notable changes, grouped by theme — not a full commit history
(see `git log` for that). New entries get appended under the section they
fit best; add a new section if none fits.

## Auth
- Logged-in/out header state via silent token refresh, redirect to
  schlussel's hosted login and back.
- The home page now requires authentication - unauthenticated visitors
  redirect straight to schlussel's login instead of seeing any content.
- Adopted Authorization Code + PKCE for the login handoff: generates and
  stores a PKCE verifier before redirecting, and the callback page
  exchanges the returned code for the real token via POST /auth/token
  instead of reading it from the URL fragment.

## Infrastructure
- CI (tests + lint) on every push/PR.
- Docker Compose networking on a shared `schloss-net`.
- Migrated from nginx to Caddy in the web image.
- Docker images published to GHCR on merge to `main`.
- Dependabot for both npm and GitHub Actions dependencies.
- Dropped published host port - reached only through the tor gateway now.

## Docs
- README, AGPL-3.0 LICENSE, CONTRIBUTING.md.
- Improved the browser tab title.

## Polish
- Homepage visual polish: hero illustration, a three-tile highlights strip,
  a GitHub link in the footer, smoother card hover easing.
- License/CI badges, a link to the Hof meta-repo, fixed gateway repo URL
  casing after its rename to lowercase.
- Wrote the gateway's project name lowercase ("tor") everywhere in prose.
