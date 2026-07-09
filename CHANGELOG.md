# Changelog

Brief log of notable changes, grouped by theme — not a full commit history
(see `git log` for that). New entries get appended under the section they
fit best; add a new section if none fits.

## Auth
- Logged-in/out header state via silent token refresh, redirect to
  schlussel's hosted login and back.

## Infrastructure
- CI (tests + lint) on every push/PR.
- Docker Compose networking on a shared `schloss-net`.
- Migrated from nginx to Caddy in the web image.
- Docker images published to GHCR on merge to `main`.
- Dependabot for both npm and GitHub Actions dependencies.

## Docs
- README, AGPL-3.0 LICENSE, CONTRIBUTING.md.
