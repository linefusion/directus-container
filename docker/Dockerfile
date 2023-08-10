FROM node:20-alpine

# ! TODO: ONBUILD
# ! TODO: STOPSIGNAL
# ! TODO: SHELL
# ! TODO: LABEL

# Base

RUN \
  apk add --update --no-cache su-exec && \
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
ENV CONFIG_PATH="/directus/bin/config.js"
ENV NPM_CONFIG_UPDATE_NOTIFIER="false"

WORKDIR /directus/

# Install dependencies

COPY --chown=node:node ./root/ /
RUN pnpm install

USER root

RUN \
  chmod a+x /directus/bin/entrypoint.sh && \
  chmod a+x /directus/bin/directus.sh && \
  ln -s /directus/bin/directus.sh /usr/bin/directus

USER node

# Exports

EXPOSE 8055

VOLUME ["/directus/extensions", "/directus/database", "/directus/uploads"]

# Healthchecks

HEALTHCHECK \
  --interval=30s \
  --timeout=30s \
  --start-period=1m \
  --retries=5 \
  CMD node /directus/bin/healthcheck.js || exit 1

# Runtime

ENTRYPOINT [ "./bin/entrypoint.sh" ]
CMD ["directus", "start"]
