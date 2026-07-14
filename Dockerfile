FROM node:22-alpine AS builder

# Pinned exactly, matching CI - "pnpm@latest" pulled whatever pnpm
# published most recently, which broke the build outright once (a
# self-installer bug in 11.12.0), unrelated to any change in this repo.
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

# pnpm runs a deps-status check before any "run"/"exec" script (e.g.
# the "pnpm build" below) and, on a mismatch, tries to reinstall -
# which needs interactive confirmation to purge node_modules, and a
# Docker build has no TTY to give it. GitHub Actions sets CI=true for
# every workflow automatically (which is why this never showed up
# there), so it must be set explicitly here.
ENV CI=true

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# @zudar107/schloss-ui is on GitHub Packages, not npmjs.com - even
# though the package is public, installing it still requires auth.
# The token is passed as a BuildKit secret (not an ARG, so it never
# ends up baked into an image layer) and written to a user-level
# .npmrc - pnpm refuses to expand env vars in the *project* .npmrc's
# auth line (to stop a malicious committed .npmrc from exfiltrating a
# token to an attacker registry), so it can't just go in ./.npmrc.
RUN --mount=type=secret,id=npm_token \
    echo "//npm.pkg.github.com/:_authToken=$(cat /run/secrets/npm_token)" >> /root/.npmrc \
    && pnpm install --frozen-lockfile

COPY . .

# Vite bakes import.meta.env.VITE_* into the bundle at build time, so
# this must be declared as an ARG to actually receive the value passed
# via docker-compose's build.args - without it, the value is silently
# discarded and the build always falls back to its hardcoded default.
ARG VITE_KUVERT_URL=http://localhost:5174
ARG VITE_SCHLUSSEL_URL=http://localhost:4001
RUN pnpm build

# ---

FROM caddy:2-alpine AS runner

COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
