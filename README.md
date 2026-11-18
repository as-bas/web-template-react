# web-template

Starting point for a web frontend: React 19 + Vite 8 + TypeScript, shadcn/ui on Tailwind 4, Redux Toolkit / RTK Query, React Router, `en` / `id`, light/dark theme. Builds to **static HTML + assets** (`dist/`), served by Caddy in a container or by any static host. Connected out of the box to an [`api-template`](../api-template) backend (login, session refresh from an httpOnly cookie, logout, change password, `/v1/me`).

It is the default combination of [`frontend-blueprint.md`](./frontend-blueprint.md), which sits in this repo and covers the other options and the **known gaps (SEO, multi-page apps)**.

## Start a new project from it

**With Claude** (any combination): open Claude Code in this repo and prompt

```
@frontend-blueprint.md set up a new frontend
```

Claude asks what you want (engine, layout, backend, obfuscation, …), copies the template to a new directory next to this one, changes only what your answers need, and runs the checks. This repo is left untouched.

**By hand** (default combination):

```bash
rsync -a --exclude .git --exclude node_modules --exclude dist --exclude .env \
  --exclude frontend-blueprint.md ./ ../my-web/
cd ../my-web && git init
```

Then rename it in `package.json` (`name`), `.env.example` (`COMPOSE_PROJECT_NAME`), `src/config/app.ts` (`APP_NAME`), `index.html` (`<title>`, description), `public/favicon.svg`, and the first lines of `README.md` / `CLAUDE.md`.

## What's in it

- **Structure**: `app/` wiring, `features/<domain>/` (state + endpoints), `layouts/`, `pages/<route>/`, `components/ui` (shadcn) + `components/common`, `services/api.ts` (one base API). See `CLAUDE.md`.
- **Auth against the API**: access token in memory only, refresh cookie restores the session on load, one shared refresh on 401s, retry on `409 REFRESH_TOKEN_ROTATED`, route guards.
- **Pages**: login, home (`GET /v1/me`), change password, 404, inside a collapsible sidebar shell.
- **i18n**: English text as keys, `pnpm i18n:sync`, API errors come back translated via `X-Lang`.
- **Production**: Caddy image with SPA fallback, `no-cache` HTML, immutable hashed assets, gzip/zstd, same-origin `/v1` proxy to the API.
- **Optional obfuscation**: `OBFUSCATE=true` (app chunk only; vendor untouched).
- **Tests**: Vitest for the auth/refresh logic.

## Requirements

Containerized (recommended): [Podman](https://podman.io) with `podman compose` (or Docker) and [`just`](https://github.com/casey/just). Host: Node from `.nvmrc` (`nvm use`) and pnpm (`corepack enable`). A running `api-template` API for anything past the login page.

## Setup

```bash
cp .env.example .env          # API_UPSTREAM = where the API listens
just build                    # dev image
just app                      # vite dev server on $PORT, /v1 proxied to the API
```

On the host instead: `nvm use && corepack enable && pnpm install && pnpm dev`.

The API must list this site in its `CORS_ORIGIN` (e.g. `http://localhost:5173`): the refresh endpoint checks `Origin` even through the proxy.

```bash
pnpm test && pnpm lint && pnpm build   # checks
just preview                           # production image (caddy) on $PORT
OBFUSCATE=true just preview            # same, obfuscated
```

## Deploy

```bash
just deploy-manual            # = scripts/deploy.sh
```

Needs only podman or docker on the server. Builds the `runtime` image with `.env`'s `VITE_API_URL` / `OBFUSCATE` baked in, replaces `<COMPOSE_PROJECT_NAME>-web` on `PORT`, prunes this project's old images. Caddy proxies `/v1` to `API_UPSTREAM` (`API_NETWORK` = the API's network to use `http://api:<port>`). TLS belongs to the proxy in front.

Any other static host works too: upload `dist/`, fall back to `index.html` for unknown paths, serve `assets/` with a long cache and `index.html` with `no-cache`, and proxy `/v1` to the API (or build with an absolute `VITE_API_URL`; see the blueprint).
