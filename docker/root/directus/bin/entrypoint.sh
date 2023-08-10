#!/usr/bin/env sh

set -e

# Cache & volume
# mkdir -p /directus/{uploads,database,extensions/.packages}
# chown -R node:node /directus

# Install Directus & packages
node "$(dirname $0)/entrypoint.js"

# Start Directus
exec "$@"
