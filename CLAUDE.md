# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **In `web-template` itself** (remove this note in a project made from it): this repo is the template. To start a new project, follow `frontend-blueprint.md` §0: ask the questions, copy to a new directory, never edit the template while doing so. Change the template only when the user asks to improve the template.

Started from `web-template` (the default combination of the frontend blueprint: Podman, React SPA with a sidebar shell, shadcn/ui, connected to an `api-template` backend with cookie-refresh JWT auth, `en` + `id`, light/dark theme, Caddy static host, obfuscation available but off). Other combinations: see `frontend-blueprint.md` in `web-template`.

## Stack

React 19 + Vite 8 (Rolldown) SPA, TypeScript 7 (strict, `verbatimModuleSyntax`; `tsc -b` type-checks only, Vite builds). Redux Toolkit + RTK Query for state and API calls, React Router 8 (data router), i18next / react-i18next, Tailwind CSS 4 + shadcn/ui (radix base, `radix-nova` style, lucide icons), next-themes. Vitest (jsdom). Lint/format via Biome, pre-commit via Husky. Package manager: pnpm. Path alias `@/*` → `src/*`.

Builds to **static files only** (`dist/`: `index.html` + hashed assets), no Node server at runtime. The backend is an `api-template` API (its contract: `docs/auth.md` there).

**Filenames are kebab-case** (`auth-slice.ts`, `login-form.tsx`).

## Commands

```bash
pnpm dev            # vite dev server on PORT, proxies /v1 -> API_UPSTREAM
pnpm build          # tsc -b + vite build -> dist/ (+ obfuscation when OBFUSCATE=true)
pnpm preview        # serve dist/ locally
pnpm test           # vitest run
pnpm lint           # biome lint (report only)
pnpm format         # biome check --write (format + sort imports + lint fixes)
pnpm i18n:sync      # scan src/ for t("...") keys, sync src/locales/*.json
```

Pre-commit (`.husky/pre-commit`): `pnpm lint && pnpm format && pnpm build`. Commit messages: `.claude/rules/commits.md` (one line `type(scope): description`, no trailers, never push without asking).

### Local environment (podman + node)

`just app` (dev server in podman), `just build` (rebuild the dev image after dependency changes), `just pnpm <args>`, `just dist` (static build into `./dist`), `just preview` (production caddy image on `PORT`; stop `just app` first), `just deploy-manual` (server deploy). See `justfile` and `podman/compose.dev.yml`.

`.env` keeps one value per concern: `PORT`, `API_UPSTREAM` (the API for every mode; `host.containers.internal` is read as `localhost` on the host), `VITE_API_URL`, `OBFUSCATE`, `COMPOSE_PROJECT_NAME`. Don't add per-mode variants.

- On the host, run node / pnpm through `nvm` with the version in `.nvmrc`: `source ~/.nvm/nvm.sh && nvm use` in the **same** command as `pnpm ...`. If nvm or that version is missing, tell the user rather than working around it.
- The API runs from its own repo. If it isn't up, tell the user to start it; never start containers yourself.
- Add dependencies on the host (`pnpm add ...`), then `just build` so the image picks them up.

### Deploy (manual)

`just deploy-manual` (`scripts/deploy.sh`, podman or docker only): builds `docker/Dockerfile` target `runtime` (static `dist/` served by caddy, `docker/caddy/Caddyfile`; `VITE_API_URL` and `OBFUSCATE` from `.env` baked in) as `<COMPOSE_PROJECT_NAME>:latest`, replaces `<COMPOSE_PROJECT_NAME>-web` on `PORT`. Caddy proxies `/v1` to `API_UPSTREAM`; set `API_NETWORK` to the API's network to reach it as `http://api:<PORT>`. Plain http on :80; TLS is the front proxy's job. One tagged image per project: after the swap the script prunes dangling images labeled `app.image=<COMPOSE_PROJECT_NAME>` (every Dockerfile stage carries that label).

## Architecture

```
src/
  main.tsx        # entry: i18n + css, kicks off session restore, renders <App/>
  app/            # wiring: app.tsx (providers), router.tsx, store.ts, hooks.ts
  config/         # app.ts (APP_NAME), env.ts (build-time env), navigation.ts (sidebar), themes.ts
  services/       # api.ts: RTK Query base api (auth header, X-Lang, refresh-on-401)
  features/       # domain state + endpoints, shared across pages
    auth/         #   auth-slice.ts, auth-api.ts, types.ts, components/ (route guards)
  layouts/        # one folder per layout, with its own components
    auth/         #   guest pages: logo + switchers, page centered
    dashboard/    #   sidebar shell: app-sidebar (nav-main, nav-user) + page-header
  pages/          # one folder per route: <name>-page.tsx + components/ (page-only)
  components/
    ui/           # shadcn generated: add via `pnpm dlx shadcn@latest add <name>`, don't hand-edit
    common/       # app-wide components (form field, password input, switchers, loader, logo)
  hooks/          # shared hooks (use-document-title, use-mobile)
  lib/            # pure helpers (api-error.ts, initials.ts, utils.ts)
  i18n/           # i18next setup
  locales/        # en.json, id.json (managed by `pnpm i18n:sync`)
  types/          # shared types (API envelopes, route handle)
```

Where code goes: used by one page → `pages/<page>/components/`; by one layout → `layouts/<layout>/`; app-wide → `components/common/`. Domain state and API endpoints → `features/<domain>/`.

**Build reusable components when a pattern can repeat** (data table, filter bar, empty state, confirm dialog, status badge, form field). Check `components/common/` and `components/ui/` first. Compose shadcn primitives from `components/ui/` rather than editing them; add missing ones with the shadcn CLI. Keep components presentational: data comes in through props, labels through `t` at the call site.

### Routing

`src/app/router.tsx` nests **guard → layout → pages**. `GuestOnly` / `RequireAuth` (`features/auth/components/`) redirect on auth status; a new layout is another branch at the layout level. Pages set the header and the document title through `handle: { title: (t) => t("..."), description: (t) => t("...") } satisfies RouteHandle` (layouts call `useDocumentTitle()`). Unknown paths render `NotFoundPage` inside the dashboard layout; guests go to login first. The static host must fall back to `index.html` for unknown paths (`docker/caddy/Caddyfile` does).

### Auth (api-template contract)

- `POST /v1/auth/login` returns `{ accessToken, expiresIn, user }` and sets an **httpOnly `refresh_token` cookie** (path `/v1/auth`, SameSite Strict).
- The access token is kept **in Redux memory only** and sent as `Authorization: Bearer`. Never persist it to storage.
- On boot, `main.tsx` dispatches `authApi.endpoints.refresh` to restore the session from the cookie; status is `restoring` until it settles.
- `services/api.ts` refreshes on any 401 (outside `/v1/auth/*`) and replays the request. Refreshes are de-duplicated (one in flight); `409 REFRESH_TOKEN_ROTATED` (another tab won the rotation) is retried after a short delay. Covered by `src/services/api.test.ts`.
- All requests use `credentials: "include"` and send `X-Lang`, so API error messages come back translated: show `message` as-is (`lib/api-error.ts`; `getFieldErrors` maps a 422's `errors[]` to fields).

Dev uses the Vite proxy (`/v1` → the API) and prod the caddy proxy, so the cookie is same-origin. If `VITE_API_URL` points at another origin, the API's `CORS_ORIGIN` must list this site and both must be the same site (SameSite cookie).

### Time

The API is UTC only (ISO 8601 with `Z`). Format in the viewer's zone (or a zone the API gives you) with an explicit `Intl.DateTimeFormat` / `toLocaleString(locale, …)`; send timestamps with `toISOString()`. Compare on parsed `Date`s or raw ISO strings, never on formatted text.

### Adding API endpoints

Inject into the base api from the feature folder: `api.injectEndpoints({ endpoints: (build) => ({ ... }) })`. Unwrap the `{ success, data }` envelope with `transformResponse: (r: ApiSuccess<T>) => r.data`. Add tag types to `services/api.ts` when a cache needs invalidation. Lists follow the API's list contract (`q`, `sort` with `-`, `limit`, forward-only `cursor` + `meta.hasMore`, no total): "Load more", not page numbers (`ApiList<T>` in `types/api.ts`).

### i18n

Keys are the **English source text**: `t("Home")`, `t("Welcome, {{name}}", { name })`. Always call `t` with a literal string so `pnpm i18n:sync` finds it (config labels take `t` as a parameter, see `config/navigation.ts`). Run `pnpm i18n:sync` after adding strings, then fill `src/locales/id.json`; empty values fall back to English.

### Build output and obfuscation

`dist/index.html` (served `no-cache`) + `dist/assets/*` (hashed, served immutable). Libraries go to their own `vendor-*.js` chunk (`vite.config.ts`). `OBFUSCATE=true` runs `scripts/obfuscate.ts` after the build on our chunks only, **never `vendor-*`**: javascript-obfuscator miscompiles RTK Query (a renamed block-scoped function → "is not defined", the app hangs on the loader). It is not security: the bundle is public. **Never put a secret in a `VITE_` variable**: it ships in the bundle.

### Testing

Vitest (`pnpm test`), jsdom, `src/**/*.test.ts(x)`. Stub `fetch` (`vi.stubGlobal`) with responses shaped like the real API. Tests get `VITE_API_URL=http://api.test` (Node's `Request` needs absolute URLs). Use `makeStore()` for a fresh store per test.
