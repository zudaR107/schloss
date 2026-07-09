# Schloss

Schloss ("castle" / "lock" in German) is the home page and launcher for a small suite of
self-hosted personal services. It's the first thing you see: it shows which services are
available and, once you're signed in, a bit of personalization.

## How it fits into the platform

Each service is its own repo, named after a German word related to what it does:

- **`schloss`** (this repo) — the home page / launcher
- [`schlussel`](https://github.com/zudaR107/schlussel) — auth: accounts, login, tokens
- [`kuvert`](https://github.com/zudaR107/kuvert) — envelope budgeting, the first real
  service

The home page requires being signed in — an unauthenticated visitor is redirected
straight to Schlüssel's hosted login page and back, after which the header shows your
name and a logout option.

## Local development

```sh
pnpm install
cp .env.example .env
pnpm dev
```

Runs on `http://localhost:3000`.

```sh
pnpm test
pnpm lint
```

### Environment variables

See `.env.example`. `VITE_KUVERT_URL` and `VITE_SCHLUSSEL_URL` are read at *build* time
(Vite bakes them into the bundle) — they're where the Kuvert service card links to and
where the "Войти" button redirects, respectively. `KUVERT_URL` / `SCHLUSSEL_WEB_URL` are
the same values, but as the Docker build args `docker-compose.yml` passes through.

## Running with Docker

```sh
docker network create schloss-net   # one-time, shared with the other repos
docker compose up -d
```

Does not publish a host port — reached through the
[Tor](https://github.com/zudaR107/Tor) gateway (`http://localhost` in local dev), on the
same `schloss-net` network as `schlussel` and `kuvert` so it can reach both by hostname.

## License

AGPL-3.0 — see [LICENSE](LICENSE).
