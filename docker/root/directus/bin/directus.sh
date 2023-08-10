#!/usr/bin/env sh

set -e

NODE_OPTIONS="--max-old-space-size=${NODE_MEMORY:-8096} ${NODE_OPTIONS}"

if [ "${DIRECTUS_BOOTSTRAP_ENABLED}" == "true" ]; then
  node "/directus/bin/directus.js" bootstrap
fi

node "/directus/bin/directus.js" "$@"

