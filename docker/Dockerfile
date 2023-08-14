FROM node:20-alpine AS base

# ! TODO: ONBUILD
# ! TODO: STOPSIGNAL
# ! TODO: LABEL

# Base

ENV PNPM_HOME=/usr/local/bin
RUN \
  corepack enable && \
  corepack prepare --activate pnpm@latest

# Environment

USER node

ENV DIRECTUS_VERSION="latest"
ENV DIRECTUS_BOOTSTRAP_ENABLED="true"
ENV DIRECTUS_PACKAGES_ENABLED="true"

ENV PORT="8055"
ENV LOGGER_HTTP_AUTO_LOGGING="false"

ENV NODE_ENV="production"
ENV NODE_PACKAGES=""

ENV PORT="8055"
ENV DB_CLIENT="sqlite3"
ENV DB_FILENAME="/directus/database/database.sqlite"
ENV EXTENSIONS_PATH="/directus/extensions"
ENV STORAGE_LOCAL_ROOT="/directus/uploads"
ENV CONFIG_PATH="/directus/entrypoint/directus.config.js"
ENV NPM_CONFIG_UPDATE_NOTIFIER="false"

WORKDIR /directus/

# Install dependencies

COPY --chown=node:node ./root/ /

USER node
RUN \
  mkdir -p /directus/extensions && \
  mkdir -p /directus/database && \
  mkdir -p /directus/uploads && \
  mkdir -p /directus/node_modules && \
  mkdir -p /directus/packages && \
  pnpm install

USER root
RUN \
  chown -R node:node /directus/ && \
  chmod +x /usr/bin/directus && \
  chmod +x /usr/bin/entrypoint && \
  chmod +x /usr/bin/healthcheck
USER node


# Exports

EXPOSE 8055

VOLUME "/directus/extensions"
VOLUME "/directus/database"
VOLUME "/directus/uploads"

VOLUME "/directus/packages"
VOLUME "/directus/node_modules"

# Healthchecks

HEALTHCHECK \
  --interval=30s \
  --timeout=30s \
  --start-period=1m \
  --retries=5 \
  CMD healthcheck

# Runtime

ENTRYPOINT [ "entrypoint" ]
CMD ["directus", "start"]
