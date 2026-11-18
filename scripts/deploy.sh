#!/usr/bin/env sh
# Manual deploy without compose. Only podman or docker is needed on the
# server: no node, no pnpm. Rebuilds the prod image (docker/Dockerfile, target
# `runtime`: the static build served by caddy), then replaces the container.
#
#   image:      <COMPOSE_PROJECT_NAME>:latest (VITE_API_URL and OBFUSCATE from
#               .env baked in)
#   container:  <COMPOSE_PROJECT_NAME>-web, env from .env, -p <PORT>:80
#   network:    API_NETWORK if set (the API's network, so API_UPSTREAM can be
#               http://api:<its PORT>), else the engine's default
#   retention:  one tagged image. After the swap, dangling images labeled
#               app.image=<COMPOSE_PROJECT_NAME> (the previous build and its
#               cached stages) are pruned, so rebuilds don't pile up.
#
# Engine: podman if installed, else docker. Override with CONTAINER_ENGINE.
# Usage: scripts/deploy.sh
set -eu

cd "$(dirname "$0")/.."

ENV_FILE=.env
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE" >&2; exit 1; }

# read KEY from an env file without sourcing it (last match wins, surrounding
# quotes stripped)
env_get() {
    sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" "$ENV_FILE" |
        tail -n 1 | sed -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' \
        -e "s/^'\(.*\)'$/\1/"
}

if [ -n "${CONTAINER_ENGINE:-}" ]; then
    ENGINE=$CONTAINER_ENGINE
elif command -v podman >/dev/null 2>&1; then
    ENGINE=podman
elif command -v docker >/dev/null 2>&1; then
    ENGINE=docker
else
    echo "neither podman nor docker is installed" >&2
    exit 1
fi

NAME=$(env_get COMPOSE_PROJECT_NAME)
[ -n "$NAME" ] || { echo "COMPOSE_PROJECT_NAME not set in $ENV_FILE" >&2; exit 1; }
PORT=$(env_get PORT)
PORT=${PORT:-8080}
API_NETWORK=$(env_get API_NETWORK)
IMAGE="$NAME:latest"
CONTAINER="$NAME-web"

NETWORK_ARGS=""
if [ -n "$API_NETWORK" ]; then
    "$ENGINE" network inspect "$API_NETWORK" >/dev/null 2>&1 || {
        echo "network $API_NETWORK not found (deploy the API first)" >&2
        exit 1
    }
    NETWORK_ARGS="--network $API_NETWORK"
fi

echo "==> engine: $ENGINE, image: $IMAGE"
"$ENGINE" build -f docker/Dockerfile --target runtime \
    --build-arg "IMAGE_LABEL=$NAME" \
    --build-arg "VITE_API_URL=$(env_get VITE_API_URL)" \
    --build-arg "OBFUSCATE=$(env_get OBFUSCATE)" -t "$IMAGE" .

# stop if running, then remove (stopped containers still hold the name)
running=$("$ENGINE" container inspect -f '{{.State.Running}}' "$CONTAINER" \
    2>/dev/null || true)
if [ "$running" = true ]; then
    echo "==> stopping $CONTAINER"
    "$ENGINE" stop -t 10 "$CONTAINER" >/dev/null
fi
if "$ENGINE" container inspect "$CONTAINER" >/dev/null 2>&1; then
    echo "==> removing $CONTAINER"
    "$ENGINE" rm "$CONTAINER" >/dev/null
fi

echo "==> starting $CONTAINER"
# shellcheck disable=SC2086 # NETWORK_ARGS is empty or two words
"$ENGINE" run -d --name "$CONTAINER" --restart unless-stopped $NETWORK_ARGS \
    --env-file "$ENV_FILE" -p "$PORT:80" "$IMAGE" >/dev/null

echo "==> pruning old images"
"$ENGINE" image prune -f --filter "label=app.image=$NAME" >/dev/null

"$ENGINE" ps --filter "name=$CONTAINER"
