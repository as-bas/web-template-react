set dotenv-load

# Docker instead of Podman: move podman/compose.dev.yml to docker/ and use
# "docker compose -f docker/compose.dev.yml" here (scripts pick the engine).
compose := "podman compose -f podman/compose.dev.yml"

# list recipes
default:
    @just --list

# build dev image (rerun after dependency changes)
build:
    {{compose}} build web

# run vite dev server on $PORT (proxies /v1 to API_UPSTREAM)
app:
    {{compose}} up web

# run pnpm in container (exec if up, else run --rm). e.g. `just pnpm i18n:sync`
pnpm *args:
    scripts/pnpm.sh {{args}}

# build the static site into ./dist (in container)
dist:
    scripts/pnpm.sh build

# build + serve the production image (caddy) on $PORT (stop `just app` first)
preview:
    {{compose}} --profile preview up --build preview

# rebuild the prod image (static build + caddy) from .env and recreate the container (podman or docker only, no compose, no node)
deploy-manual:
    scripts/deploy.sh

# stop + remove all
down:
    {{compose}} --profile preview down

# tail logs
logs:
    {{compose}} logs -f
