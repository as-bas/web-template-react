# syntax=docker/dockerfile:1

# Every stage carries `app.image=<IMAGE_LABEL>` so scripts/deploy.sh can
# prune this project's dangling images (previous build + cached stages) only.

# ---- deps: shared base, installs all deps (incl. dev) ----
FROM docker.io/library/node:24.21.0-alpine AS deps
ARG IMAGE_LABEL=web-template
LABEL app.image=$IMAGE_LABEL
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- builder: type-check + vite build (+ optional obfuscation) -> dist ----
FROM deps AS builder
WORKDIR /app
COPY . .
# Inlined into the bundle at build time. Empty = same origin as the page
# (caddy proxies /v1 to API_UPSTREAM).
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
ARG OBFUSCATE=false
ENV OBFUSCATE=$OBFUSCATE
RUN pnpm build

# ---- runtime: caddy serving the static build ----
FROM docker.io/library/caddy:2.10-alpine AS runtime
ARG IMAGE_LABEL=web-template
LABEL app.image=$IMAGE_LABEL
# Where /v1 is proxied (read by the Caddyfile at start).
ENV API_UPSTREAM=http://host.containers.internal:3000
COPY docker/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /srv
EXPOSE 80

# ---- dev: vite dev server, source from bind mount ----
FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development
EXPOSE 5173
# source mounted at runtime; node_modules baked from deps stage
CMD ["pnpm", "dev"]
