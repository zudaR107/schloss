FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite bakes import.meta.env.VITE_* into the bundle at build time, so
# this must be declared as an ARG to actually receive the value passed
# via docker-compose's build.args - without it, the value is silently
# discarded and the build always falls back to its hardcoded default.
ARG VITE_KUVERT_URL=http://localhost:5174
RUN pnpm build

# ---

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
