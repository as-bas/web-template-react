# Frontend Blueprint

How to set up a new web frontend with our house conventions: a React SPA that builds to **static HTML + assets**, shadcn/ui components, clear project structure, optional obfuscation, connected to an `api-template` backend. Self-contained: it depends on no other project.

- **This file lives at the root of `web-template`** (`/Volumes/Dock/Development/teams/aluesa/poc/web-template`). The repo around it is the default combination, ready to copy. This file covers the variations and the known gaps.
- Backend counterpart: `api-template` (`/Volumes/Dock/Development/teams/aluesa/poc/api-template`, with `backend-blueprint.md`). Its `docs/auth.md` is the auth contract this frontend implements.
- **Validated 2026-11-09** with: Node 24.21, pnpm 10.23, React 19.3, Vite 8.3 (Rolldown 1.2), TypeScript 7.0, React Router 8.5, Redux Toolkit 2.14, i18next 27, Tailwind 4.3, shadcn CLI 4.23 (`radix-nova`), Vitest 5.1 + jsdom 31, javascript-obfuscator 5.10, Caddy 2.10, Podman 6.1. See [§16](#16-validation-log).

Status markers:

| Marker | Meaning |
| --- | --- |
| `[template]` | In `web-template`, checked (tests, build, browser run) |
| `[proven]` | Used in production in an earlier project; not in `web-template` |
| `[design]` | **Not built anywhere yet.** A proposal: build and test it before relying on it |

---

## 0. Instructions for Claude (read first)

When the user points you at this file to start a new frontend:

0. **The new project goes in a new directory. Never modify `web-template` itself** while setting one up.
1. **Don't scaffold yet.** Ask the questions in [§1](#1-choices-ask-before-scaffolding) with `AskUserQuestion`, in rounds (at most 4 per call), recommended option first, marked "(Recommended)".
2. Show a short **resolved choices** table with the implied consequences. Ask about contradictions before going on.
3. **Copy the template** (from the `web-template` root) to the target directory:
   ```bash
   rsync -a --exclude .git --exclude node_modules --exclude dist --exclude .env \
     --exclude frontend-blueprint.md ./ <target>/
   cd <target> && git init
   ```
   Rename: `package.json` `name`, `.env.example` `COMPOSE_PROJECT_NAME`, `src/config/app.ts` `APP_NAME`, `index.html` `<title>` + description, `public/favicon.svg`. All defaults → that's the scaffold. Otherwise change only what the choices need ([§15](#15-scaffold-order--checklist)). **No unused dependency, file, env var or component.**
4. Prove it: `pnpm install`, `pnpm test`, `pnpm lint`, `pnpm build`; with the API running, log in through `pnpm dev` (or `just app`), and through `just preview` for the production image. If obfuscation is on, **load the obfuscated build in a browser** (it can build fine and still not boot, see §10).
5. Rewrite `CLAUDE.md` and `README.md` for **that** project (drop the template note). Keep `.claude/rules/commits.md`.

---

## 1. Choices (ask before scaffolding)

### Round 1

| Header | Question | Options (first = default) | What it changes |
| --- | --- | --- | --- |
| `Engine` | Container engine? | **Podman** · Docker | compose folder, `justfile` `compose` line ([§12](#12-containers-podman-or-docker)) |
| `Backend` | Which backend? | **api-template (JWT + refresh cookie)** · Other API (describe it) · None (static site) | `services/api.ts`, `features/auth/`, guards, proxy ([§5](#5-connecting-to-the-backend)) |
| `Layout` | App shell? | **Sidebar (collapsible)** · Top bar · None (single page) | `layouts/dashboard/`, shadcn components ([§7](#7-ui-shadcn)) |
| `Obfuscate` | Obfuscate the production JavaScript? | **No** · Yes | `OBFUSCATE` default in `.env.example` ([§10](#10-obfuscation-optional)) |

### Round 2

| Header | Question | Options | What it changes |
| --- | --- | --- | --- |
| `i18n` | Languages? | **en + id** · en only · other (list them) | `src/i18n/index.ts`, `src/locales/`, `scripts/i18n-sync.ts` `TARGET_LOCALES` |
| `Theme` | Theming? | **Light / dark / system switch** · Light only | `next-themes`, `ThemeSwitcher`, `config/themes.ts` |
| `API origin` | How does the browser reach the API? | **Same origin, proxied `/v1`** · Separate origin (`VITE_API_URL`) | Caddy proxy vs CORS + same-site setup ([§5.3](#53-same-origin-vs-separate-origin)) |
| `Hosting` | Where does `dist/` run? | **Caddy container (deploy.sh)** · Any static host / CDN | Dockerfile/Caddyfile vs host config ([§9](#9-build-output-and-hosting)) |

### Round 3

| Header | Question | Options | What it changes |
| --- | --- | --- | --- |
| `SEO` | Do public pages need search engines / link previews? | **No (app behind login)** · Yes | If yes: read [§11.1](#111-seo) and agree on an approach before building; the template doesn't solve it |
| `Pages` | One app or several separate HTML entry points? | **One SPA** · Several (MPA) | If several: [§11.2](#112-mpa-multi-page) (`[design]`) |

Then ask in plain text: **project name** (kebab-case), **target directory** (default `../<project name>`), **app display name**, **dev port** (default 5173), **API URL** (`API_UPSTREAM`, default `http://host.containers.internal:3000`).

### Implied rules

- **Never put an API key or any secret in the frontend.** Everything in `VITE_*` and in the bundle is public. Server-to-server API keys (api-template's client auth) are for backends only. A browser talks to the API as a **user** (JWT) or anonymously.
- **Backend = None** ⇒ drop `services/api.ts` auth logic, `features/auth/`, the guards, the `/v1` proxy (Vite and Caddy), `VITE_API_URL` / `API_UPSTREAM`.
- **Other API** ⇒ keep the RTK Query base API and rewrite `baseQueryWithReauth` for that API's auth. Keep the rules: token in memory, never in `localStorage`.
- **Separate origin** ⇒ the API must list the site in `CORS_ORIGIN` (no `*`), and site + API must be **same-site** (`app.example.com` + `api.example.com`), or the `SameSite=Strict` refresh cookie is never sent.
- **Layout = None** ⇒ drop `layouts/dashboard/` and the `sidebar`, `sheet`, `tooltip`, `skeleton`, `avatar`, `dropdown-menu` components if nothing else uses them.
- **SEO = Yes** ⇒ an SPA alone isn't enough; see §11.1 before writing pages.

---

## 2. Fixed stack

| Concern | Choice |
| --- | --- |
| Runtime (build only) | Node 24 (exact version in `.nvmrc` and the Dockerfile), pnpm 10 via corepack |
| UI | React 19 |
| Build | Vite 8 (Rolldown bundler), `@vitejs/plugin-react`, static output only |
| Language | TypeScript 7 (`tsc -b` type-checks only, `noEmit`). TS 7 is fine here: nothing needs its JS compiler API (unlike ts-jest on the backend) |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`, no config file), `tw-animate-css` |
| Components | shadcn/ui, radix base, style `radix-nova`, base color `neutral`, CSS variables, lucide icons (`components.json`) |
| State + API | Redux Toolkit + RTK Query (one base API, features inject endpoints) |
| Routing | React Router 8, data router (`createBrowserRouter`) |
| i18n | i18next + react-i18next, English text as keys |
| Theme | next-themes (`class` on `<html>`) |
| Toasts | sonner (shadcn `sonner`) |
| Tests | Vitest + jsdom |
| Lint/format | Biome 2 (`preset: "recommended"`, Tailwind directives in CSS, relaxed for `components/ui/**`) |
| Hooks | husky `pre-commit`: `pnpm lint && pnpm format && pnpm build` |
| Prod server | Caddy 2 (static files + `/v1` reverse proxy) |
| Tasks | `just` |

Path alias `@/*` → `src/*` (`tsconfig.json` `paths` + `vite.config.ts` `resolve.alias`). The dev and test tsconfig split is Vite's default: `tsconfig.app.json` (src), `tsconfig.node.json` (`vite.config.ts`, `scripts/`).

---

## 3. Directory layout

```
src/
  main.tsx              # entry: i18n + css, session restore, render <App/>
  app/                  # app.tsx (providers), router.tsx, store.ts (makeStore + store), hooks.ts
  config/               # app.ts (APP_NAME), env.ts (build-time env), navigation.ts, themes.ts
  services/             # api.ts: the one RTK Query base API (+ api.test.ts)
  features/<domain>/    # <domain>-api.ts (injected endpoints), <domain>-slice.ts, types.ts, components/, use-*.ts
  layouts/<layout>/     # <layout>-layout.tsx + its own parts (app-sidebar, nav-*, page-header)
  pages/<route>/        # <route>-page.tsx + components/ (used by that page only)
  components/ui/        # shadcn generated (CLI only)
  components/common/    # app-wide reusable components
  hooks/                # shared hooks
  lib/                  # pure helpers (api-error.ts, utils.ts with cn())
  i18n/index.ts         # i18next setup
  locales/              # en.json, id.json
  types/                # api.ts (envelopes), router.ts (RouteHandle)
public/                 # copied as is: favicon.svg, robots.txt
scripts/                # i18n-sync.ts, obfuscate.ts, deploy.sh, pnpm.sh
docker/                 # Dockerfile, caddy/Caddyfile
podman/ or docker/      # compose.dev.yml (see §12)
```

**Where code goes**: one page → `pages/<page>/components/`; one layout → `layouts/<layout>/`; app-wide → `components/common/`; domain state and endpoints → `features/<domain>/`. Two pages need it → move it up, don't copy it.

---

## 4. Naming conventions

| Thing | Convention | Example |
| --- | --- | --- |
| Files | kebab-case, always | `auth-slice.ts`, `login-form.tsx`, `use-document-title.ts` |
| Components | PascalCase named exports (no default exports) | `export function LoginForm()` |
| Pages / layouts | `<name>-page.tsx` → `XxxPage`, `<name>-layout.tsx` → `XxxLayout` | `home-page.tsx` → `HomePage` |
| Hooks | `use-xxx.ts` → `useXxx` | `use-mobile.ts` → `useIsMobile` |
| API slices | `<domain>-api.ts` → `xxxApi`, hooks `useXxxQuery` / `useXxxMutation` | `authApi`, `useLoginMutation` |
| Redux slices | `<domain>-slice.ts` → `xxxSlice`, actions past tense (`sessionReceived`), selectors `selectXxx` | `selectCurrentUser` |
| Types | PascalCase; API request bodies `XxxRequest` | `Session`, `LoginRequest` |
| Routes | kebab-case paths | `/change-password` |
| i18n keys | the English sentence | `t("Log in")` |
| Env | `VITE_*` only for values the bundle needs (all public); others plain (`PORT`, `API_UPSTREAM`) | `VITE_API_URL` |
| Images / containers | `<COMPOSE_PROJECT_NAME>:latest` / `<COMPOSE_PROJECT_NAME>-web` | `shop-web:latest` |
| Commits | `type(scope): description`, one line, no trailers | `feat(login): show field errors` |

---

## 5. Connecting to the backend

### 5.1 The API contract (api-template) `[template]`

| Thing | Shape |
| --- | --- |
| Success | `{ success: true, data }` (`ApiSuccess<T>`) |
| List | `{ success: true, data: [], meta: { nextCursor, hasMore } }` (`ApiList<T>`): forward-only cursor, no total, so "Load more", never page numbers |
| Error | `{ success: false, message, code?, data?, errors?: [{ path, message, code }] }` (`ApiFailure`): `message` already translated |
| Language | Send `X-Lang` (the UI language) on every request |
| Time | Every timestamp is ISO 8601 UTC with `Z`; send `toISOString()` |
| Auth | See 5.2 |

Error handling: `getErrorMessage(error)` (API message, else "Unable to reach the server" / "Something went wrong"), `getErrorCode(error)` to branch on `code` (never on text), `getFieldErrors(error)` to put 422 messages under their fields (`lib/api-error.ts`).

### 5.2 Auth flow `[template]`

- Login: `POST /v1/auth/login` → `{ accessToken, expiresIn, user }` + httpOnly `refresh_token` cookie (path `/v1/auth`, `SameSite=Strict`).
- **Access token in Redux memory only** (`auth-slice.ts`), sent as `Authorization: Bearer`. Never `localStorage` / `sessionStorage` / a non-httpOnly cookie.
- Boot: `main.tsx` dispatches the `refresh` mutation outside React (StrictMode can't double-fire it). Status `restoring` → guards show a loader → `authenticated` or `guest`.
- `baseQueryWithReauth` (`services/api.ts`): any 401 outside `/v1/auth/*` → one shared refresh (`refreshing` promise, so concurrent 401s don't rotate twice) → replay. `409 REFRESH_TOKEN_ROTATED` (another tab won) → retry after 300/600 ms. Refresh refused → `sessionCleared` → guards send to `/login`.
- Logout: `POST /v1/auth/logout`, then clear the session **and** `api.util.resetApiState()` (no data of the previous user stays cached), even if the call failed.
- Change password: `POST /v1/auth/password` (204); other sessions end, this one stays.
- Guards: `GuestOnly` (login & co, signed-in users go back to `state.from`), `RequireAuth` (guests go to `/login` with `state.from`).
- The API owns authorization. Hide or disable actions by role in the UI, but still handle 403.

### 5.3 Same origin vs separate origin

| | Same origin (default) `[template]` | Separate origin `[design]` |
| --- | --- | --- |
| `VITE_API_URL` | empty | `https://api.example.com` |
| Dev | Vite proxies `/v1` → `API_UPSTREAM` (`cookieDomainRewrite: ""`) | same proxy, or direct with CORS |
| Prod | Caddy proxies `/v1` → `API_UPSTREAM` | browser calls the API directly |
| CORS | none needed | API `CORS_ORIGIN` lists the site exactly (no `*`, credentials) |
| Cookie | first-party, always sent | only if site and API are the **same site**; different sites never work (`SameSite=Strict`) |
| CSRF | the API checks `Origin` on refresh/logout: the site's origin must be in `CORS_ORIGIN` in **both** cases | same |

The API's `CORS_ORIGIN` must list the site's origin even with the proxy, because the refresh endpoint's CSRF guard checks `Origin`.

### 5.4 Adding endpoints

```ts
// src/features/companies/companies-api.ts
export const companiesApi = api.injectEndpoints({
  endpoints: (build) => ({
    companies: build.query<ApiList<Company>, { q?: string; cursor?: string }>({
      query: (params) => ({ url: "/v1/companies", params }),
      providesTags: ["Companies"],
    }),
    createCompany: build.mutation<Company, CreateCompanyRequest>({
      query: (body) => ({ url: "/v1/companies", method: "POST", body }),
      transformResponse: (r: ApiSuccess<Company>) => r.data,
      invalidatesTags: ["Companies"],
    }),
  }),
});
```

Add the tag to `tagTypes` in `services/api.ts`. Unwrap single-object envelopes with `transformResponse`. Keep list envelopes whole (the page needs `meta`).

---

## 6. Routing, layouts and pages `[template]`

- `router.tsx`: **guard → layout → pages**. A new layout = a new branch at the layout level.
- Each route sets `handle: { title, description } satisfies RouteHandle` (functions of `t`). Layouts read it for the page header and call `useDocumentTitle()` (`<page> · <APP_NAME>`).
- `path: "*"` renders `NotFoundPage` inside the shell. The static host falls back to `index.html` so deep links work.
- Bigger apps: split routes with React Router's `lazy` (`{ path, lazy: () => import("@/pages/x/x-page") }`), so each page becomes its own chunk. The template ships one app chunk + one vendor chunk (`[design]` for lazy routes).

---

## 7. UI (shadcn)

- `components.json` as in the template. Add components with the CLI only: `pnpm dlx shadcn@latest add <name>` (they land in `src/components/ui/`). Don't hand-edit them; wrap or compose them in `components/common/`.
- New project from scratch (instead of copying): `pnpm dlx shadcn@latest init -t vite -b radix -p nova -y --no-monorepo --no-rtl` gives exactly this config (`radix-nova`, neutral). The preset is called `nova` in the CLI, `radix-nova` in `components.json`.
- The template uses: `button`, `card`, `input`, `label`, `dropdown-menu`, `select`, `sidebar` (+ `sheet`, `tooltip`, `separator`, `skeleton`, `use-mobile`), `avatar`, `sonner`. Wrap the app in `TooltipProvider` (the sidebar needs it) and render `<Toaster />` once.
- Theme tokens are CSS variables in `src/index.css` (generated by `shadcn init`; edit colors there). Font: `@fontsource-variable/geist` (self-hosted, no Google Fonts call).
- Reusable before bespoke: a pattern that can repeat (data table, filter bar, empty state, confirm dialog, status badge, form field) goes into `components/common/` with props for what varies. Labels come in through props (translated at the call site); data through props, not fetched inside.
- Forms: `FormField` (label + control + error or hint), `PasswordInput`. Validation messages come from the API's 422 (`getFieldErrors`), so the client doesn't duplicate rules; add client checks only for instant feedback.

---

## 8. i18n `[template]`

- Keys are English sentences. Always a literal in `t("…")` (config labels receive `t`, see `config/navigation.ts`).
- `pnpm i18n:sync` (`scripts/i18n-sync.ts`, runs with Node's type stripping) adds new keys to `en.json`, prunes unused ones, mirrors keys into other locales (`""` = falls back to English). Then fill `id.json`.
- Language: saved choice (`localStorage` `locale`) → browser languages → `en`. `<html lang>` follows. The API gets the same language via `X-Lang`.
- en only: keep i18next with one locale (adding a language later is data only).

---

## 9. Build output and hosting

### 9.1 What `pnpm build` produces `[template]`

```
dist/index.html                     # the one HTML page (SPA)
dist/assets/index-<hash>.js         # our code
dist/assets/vendor-<hash>.js        # node_modules (own chunk: cached across releases)
dist/assets/rolldown-runtime-<hash>.js
dist/assets/index-<hash>.css
dist/assets/*.woff2                 # self-hosted font
dist/favicon.svg, dist/robots.txt   # from public/
```

No source maps in production (`build.sourcemap: false`). `VITE_*` values are **inlined at build time**: one build per environment (dev / staging / prod API URL), or keep `VITE_API_URL` empty and let the same-origin proxy decide (the default, so one image works everywhere).

### 9.2 Caddy container `[template]`

`docker/caddy/Caddyfile`: `encode zstd gzip`; `X-Content-Type-Options: nosniff`, `Referrer-Policy`, no `Server` header; `/v1/*` → `reverse_proxy {$API_UPSTREAM}` with `X-Real-IP` / `X-Forwarded-For` set to the client (the API rate limits by IP); `/assets/*` existing files `Cache-Control: public, max-age=31536000, immutable`, **missing ones a plain uncached 404**; everything else `no-cache` + `try_files {path} /index.html`. Plain http on :80; TLS belongs to the proxy in front.

### 9.3 Any static host / CDN

Requirements: SPA fallback to `/index.html`, long cache for `/assets/*` only, `no-cache` for `index.html`, and `/v1` proxied to the API (or a separate origin, §5.3). Examples (`[design]`, not run here):

```nginx
location /assets/ { try_files $uri =404; add_header Cache-Control "public, max-age=31536000, immutable"; }
location /v1/     { proxy_pass http://api:3000; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $remote_addr; proxy_set_header Host $host; }
location /        { try_files $uri /index.html; add_header Cache-Control "no-cache"; }
```

Netlify / Cloudflare Pages `_redirects`: `/v1/*  https://api.example.com/v1/:splat  200` then `/*  /index.html  200`. S3 + CloudFront: error document `index.html` with status 200, `/v1/*` behavior to the API origin.

---

## 10. Obfuscation (optional) `[template]`

- **How**: `OBFUSCATE=true pnpm build` (or `OBFUSCATE=true` in `.env` for `just preview` / `just deploy-manual`, passed as a Docker build arg). `scripts/obfuscate.ts` runs javascript-obfuscator on `dist/assets/*.js` **except `vendor-*`**, in place, after `vite build`.
- **Why vendor is skipped**: obfuscating the whole bundle builds fine but **the app never boots**. javascript-obfuscator renamed two different identifiers in RTK Query's code to one name, so a call pointed at a block-scoped function out of its scope (`ReferenceError: _0x… is not defined`). RTK swallowed it inside the refresh mutation, so the page sat on the loader with no visible error. Libraries are public code anyway. That's also why §0 says to boot the obfuscated build in a browser.
- **Options**: conservative (string array with base64, hexadecimal names, compact; no control-flow flattening, dead code, self-defending, debug protection, global renaming or object-key transforms: those are much slower or break more code). Fixed `seed`, so the same input gives the same output: a file name hash keeps meaning one content (verified: two builds, identical md5).
- **Cost**: our chunk 42 KB → 72 KB here (about 1.7x), slower to parse. Vendor unchanged.
- **What it is not**: security. The bundle is downloaded by every visitor and can be run and stepped through. It only slows down reading. Never ship a secret, a private key or business rules that must stay hidden; those belong in the API.

---

## 11. Known gaps

### 11.1 SEO

What the SPA gives crawlers today: one `index.html` with an empty `<div id="root">`, one `<title>` and `<meta name="description">` for every URL, `robots.txt` allowing everything. Titles per page are set by JS after load (`useDocumentTitle`). Google runs JS (late, with a budget); most link-preview bots (Slack, WhatsApp, X, Facebook) and many crawlers don't. So: no per-page title/description/Open Graph in the HTML, no sitemap, content invisible without JS.

**Fine for apps behind a login** (the default): those pages shouldn't be indexed anyway.

When public pages must rank or preview, options from smallest to largest (all `[design]`):

| Option | What | Keeps "static HTML only"? | Fits when |
| --- | --- | --- | --- |
| Separate marketing site | Landing/blog/docs as their own static site (e.g. Astro, outputs plain HTML), the app stays this SPA on `app.` | Yes | Public pages are content, the app is behind login (most cases) |
| Build-time prerender | React Router **framework mode** with `ssr: false` + `prerender: ["/", "/pricing", …]` writes one HTML per listed route at build, with `meta` per route; the rest stays SPA | Yes | A few known public routes inside the same app |
| SSR | React Router framework mode with `ssr: true` (or Next.js) renders on every request | **No** (needs a Node server) | Public pages with data that changes per request |

Small improvements that don't need any of that: a real `<title>`/description in `index.html`, Open Graph tags in `index.html` for the site as a whole, `public/sitemap.xml` for known public URLs, `robots.txt` disallowing app paths.

### 11.2 MPA (multi-page)

Today there is one HTML entry (`index.html`) and client-side routing. Several separate pages (own HTML, own bundle; e.g. `/` landing + `/app/` dashboard + `/embed/` widget) aren't set up. Options (`[design]`):

- **Vite multi-page**: one HTML file per entry and `build.rolldownOptions.input: { main: "index.html", app: "app/index.html", embed: "embed/index.html" }`. Each gets its own chunks (shared code still dedupes). The host then serves each folder's `index.html` and the SPA fallback must be **per entry** (`try_files {path} /app/index.html` under `/app/*`, etc.). Each entry needs its own `main.tsx` (and router `basename` if it routes).
- **Prerender** (11.1) also gives one HTML per route, which is the usual reason people ask for an MPA.

### 11.3 Others

- **Runtime config** (`[design]`): `VITE_*` is baked at build. If one image must serve several environments with different values, serve a small `/config.js` from Caddy (env → JS) and read it at boot. The template avoids the need: `VITE_API_URL` empty + proxy.
- **Code splitting per route**: one app chunk today (§6). Add `lazy` routes when it grows.
- **CSP**: no `Content-Security-Policy` header yet. Vite's output has no inline scripts, so a strict `script-src 'self'` is possible; next-themes injects a small inline script, so it needs a hash or nonce. Add and test in the Caddyfile (`[design]`).
- **No end-to-end test suite** in the repo. The browser check in §16 was a throwaway CDP script. Add Playwright when the app has real flows.
- **No PWA / offline, no realtime** (poll with RTK Query `pollingInterval`), **no error tracking**.

---

## 12. Containers: Podman or Docker `[template]`

| | Podman (default) | Docker |
| --- | --- | --- |
| Compose file | `podman/compose.dev.yml` | `docker/compose.dev.yml` (next to the Dockerfile) |
| justfile | `compose := "podman compose -f podman/compose.dev.yml"` | `compose := "docker compose -f docker/compose.dev.yml"` |
| Scripts | `pnpm.sh` / `deploy.sh` pick podman if installed, else docker (`CONTAINER_ENGINE` overrides; `COMPOSE_FILE` for pnpm.sh) | same |
| Volume labels | keep `:z` | keep `:z` |
| File watching | `VITE_USE_POLLING=true` in the dev container (podman VM bind mounts miss fs events) | usually not needed; harmless |

The Docker engine itself was not tested (only Podman available).

- `docker/Dockerfile` stages: `deps` (pnpm install, cache mount), `builder` (`pnpm build` with `VITE_API_URL` + `OBFUSCATE` build args), `runtime` (`caddy:2.10-alpine` + `dist` at `/srv`), `dev` (vite dev server, source bind-mounted). Every stage has `LABEL app.image=$IMAGE_LABEL` (build arg = `COMPOSE_PROJECT_NAME`), so `deploy.sh` prunes only this project's dangling images.
- `podman/compose.dev.yml`: `web` (dev server, source mounts, `dist` mounted back for `just dist`) and `preview` (profile `preview`, the production image).
- **Gotcha**: `podman compose up -d --build` rebuilt the image but **kept the old container** (it served the previous build). Use `down` then `up`, or `just preview` in the foreground.
- `scripts/deploy.sh`: build the runtime image with `.env` values, stop and remove `<name>-web`, run the new one with `--env-file .env -p PORT:80` (and `--network $API_NETWORK` if set), prune old images.

---

## 13. Testing `[template]`

- Vitest, jsdom, `src/**/*.test.ts(x)` (config in `vite.config.ts` `test`).
- Stub `fetch` (`vi.stubGlobal("fetch", …)`) with responses shaped like the real API. Build a fresh store per test with `makeStore()`.
- Tests run with `VITE_API_URL=http://api.test`: Node's `Request` rejects relative URLs that a browser would resolve against the page.
- What the template tests: refresh-on-401 + replay, one shared refresh for concurrent 401s, retry on 409, local sign-out when the refresh is refused.
- Component tests (`@testing-library/react`) and browser tests (Playwright) are not included (`[design]`).

---

## 14. Lint, format, git `[template]`

- Biome: `files.includes` = `src/**`, `scripts/**`, root `*.ts` / `*.json`, not `src/locales`; Tailwind directives parsed in CSS; a11y and a few rules off for `src/components/ui/**` (generated). `pnpm lint` reports, `pnpm format` fixes.
- husky pre-commit: `pnpm lint && pnpm format && pnpm build`.
- `.gitignore` must exist before the first build: Tailwind 4 scans every file not ignored by git, and scanning `dist/` changed the CSS output between builds.
- Commits: `.claude/rules/commits.md`.

---

## 15. Scaffold order & checklist

0. Copy the template (§0 step 3). All defaults → go to step 7.
1. **Backend**: keep / adapt / remove `services/api.ts`, `features/auth/`, guards, proxies (§1 implied rules).
2. **Layout**: keep the sidebar, or replace `layouts/dashboard/` (top bar: `layouts/app/` with a header nav), or drop it. Remove shadcn components nothing uses.
3. **i18n / theme**: locales and `TARGET_LOCALES`; drop next-themes + `ThemeSwitcher` for light only.
4. **API origin**: empty `VITE_API_URL` + proxies, or the separate-origin setup (§5.3) and the API's `CORS_ORIGIN`.
5. **Hosting**: keep Caddy + `deploy.sh`, or document the static host's config (§9.3) and drop the runtime stage.
6. **Obfuscation**: set the `OBFUSCATE` default; if on, boot the obfuscated build in a browser.
7. Rename (§0), rewrite `CLAUDE.md` / `README.md`, `pnpm i18n:sync`, fill translations.
8. Verify: `pnpm install && pnpm test && pnpm lint && pnpm build`; log in with the API through `pnpm dev`; `just preview` and log in again; check deep links, a reload staying signed in, and logout.

---

## 16. Validation log

### 2026-11-09: `web-template` against a running `api-template`

Setup: `api-template` (Postgres + Redis in Podman, API on the host, seeded admin); `web-template` production image (`just preview` equivalent: Caddy + static build, `/v1` proxied to the API).

- `pnpm test` (4 tests: refresh + replay, shared refresh, 409 retry, sign-out), `pnpm lint`, `pnpm build`.
- Caddy, over curl: `/`, `/login`, a deep path → `index.html` `no-cache`; `robots.txt`; `/v1/me` → API 401 JSON; existing asset → immutable + gzip; missing asset → 404 without cache header; login through the proxy sets `refresh_token` (`Path=/v1/auth; HttpOnly; SameSite=Strict`).
- Headless Chrome over CDP, **plain and obfuscated** builds, 11 checks each, all passing: guest redirected to `/login`; document title from the route handle; wrong password shows the API's translated message; login lands on `/` with `GET /v1/me` data; **reload restores the session from the refresh cookie**; Indonesian UI after a language change; unknown path → 404 inside the shell; user menu opens; logout → `/login`; reload after logout stays logged out; no uncaught exceptions.
- `pnpm dev` (host): pages, SPA deep link, login through the Vite proxy with the cookie.
- Obfuscation: deterministic output (two builds, same md5); whole-bundle obfuscation reproduced the RTK Query break (§10), fixed by the vendor chunk split.

Not validated: the Docker engine, `just app` dev container on this machine (unchanged from a proven setup), a separate-origin deployment, the static-host examples, the SEO/MPA options.
