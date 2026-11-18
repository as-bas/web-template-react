#!/usr/bin/env sh
# Run pnpm inside the web container.
# Uses `exec` if web is already running, else spins a throwaway `run --rm`.
# Usage: scripts/pnpm.sh <pnpm args...>   e.g. scripts/pnpm.sh i18n:sync
set -eu

cd "$(dirname "$0")/.."

# podman if installed, else docker (CONTAINER_ENGINE overrides)
ENGINE=${CONTAINER_ENGINE:-$(command -v podman >/dev/null 2>&1 && echo podman || echo docker)}
COMPOSE_FILE=${COMPOSE_FILE:-podman/compose.dev.yml}
COMPOSE="$ENGINE compose -f $COMPOSE_FILE"
SERVICE="web"

# podman won't create a missing bind-mount source
mkdir -p dist

# container id of running service (empty if not up)
running=$($COMPOSE ps -q "$SERVICE" 2>/dev/null || true)

if [ -n "$running" ]; then
    exec $COMPOSE exec "$SERVICE" pnpm "$@"
else
    exec $COMPOSE run --rm --no-deps "$SERVICE" pnpm "$@"
fi
