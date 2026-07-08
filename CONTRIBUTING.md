# Contributing to Schloss

Thanks for considering a contribution. This is a small home-page/launcher app for a
self-hosted personal-services platform — please keep changes focused.

## Getting set up

```sh
pnpm install
cp .env.example .env
pnpm dev   # http://localhost:3000
```

See the [README](README.md) for environment variables and running the full stack with
Docker alongside `schlussel` and `kuvert`.

## Before opening a PR

- Run `pnpm test` and `pnpm lint` — CI runs both and will block merges that don't pass.
- Add or update tests for any behavior change.
- Keep commits focused; one logical change per PR is easier to review than several
  bundled together.
- Write commit messages that explain *why*, not just *what* — the diff already shows
  what changed.

## Opening a PR

- Branch from `main`.
- Reference the issue you're addressing if one exists (`Closes #123`).

## Reporting bugs / security issues

Open a regular issue for bugs. For anything that looks like a security vulnerability,
please use GitHub's private "Report a vulnerability" flow under this repo's Security tab
instead of a public issue.
