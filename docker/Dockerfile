# ! TODO: ONBUILD
# ! TODO: STOPSIGNAL

#
# Base image
#

ARG BASE_IMAGE="node:20-alpine"

FROM ${BASE_IMAGE} AS base

LABEL maintainer="WoLfulus <wolfulus@gmail.com>"
LABEL org.opencontainers.image.authors="WoLfulus <wolfulus@gmail.com>"
LABEL org.opencontainers.image.description="Alternative Directus container image"
LABEL org.opencontainers.image.documentation="https://github.com/linefusion/docker-cointainer/"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/linefusion/directus-container/"
LABEL org.opencontainers.image.title="Linefusion Directus Image"
LABEL org.opencontainers.image.url="https://github.com/linefusion/directus-container/"
LABEL org.opencontainers.image.vendor="Linefusion"

# ! TODO: LABEL org.opencontainers.image.created=$BUILD_DATE
# ! TODO: LABEL org.opencontainers.image.revision=$VCS_REF
# ! TODO: LABEL org.opencontainers.image.version=$VERSION

# Base

ENV PNPM_HOME=/usr/local/bin
RUN \
  corepack enable && \
  corepack prepare --activate pnpm@latest

# Environment

USER node

ENV BASE_IMAGE=${BASE_IMAGE:-"node:20-alpine"}

ARG DIRECTUS_VERSION="latest"
ENV DIRECTUS_VERSION=${DIRECTUS_VERSION:-"latest"}

ARG DIRECTUS_API_VERSION="latest"
ENV DIRECTUS_API_VERSION=${DIRECTUS_API_VERSION:-"latest"}

ENV DIRECTUS_BOOTSTRAP_ENABLED="true"
ENV DIRECTUS_PACKAGES_ENABLED="true"

ENV PORT="8055"
ENV LOGGER_HTTP_AUTO_LOGGING="false"

ENV ENTRYPOINT_INSTALL="true"

ARG NODE_ENV="production"
ENV NODE_ENV=${NODE_ENV:-"production"}
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

USER root

RUN \
  mkdir -p /directus/extensions && \
  mkdir -p /directus/database && \
  mkdir -p /directus/uploads && \
  pnpm install && \
  pnpm install @directus/api@${DIRECTUS_API_VERSION} && \
  chown -R node:node /directus/ && \
  chmod +x /usr/bin/directus && \
  chmod +x /usr/bin/entrypoint && \
  chmod +x /usr/bin/healthcheck && \
  chmod +x /usr/bin/install && \
  rm -rf /directus/packages/*

USER node

# Exports

EXPOSE 8055

VOLUME "/directus/extensions"
VOLUME "/directus/database"
VOLUME "/directus/uploads"

# Healthchecks (not working, why?)
# HEALTHCHECK \
#   --interval=30s \
#   --timeout=30s \
#   --start-period=1m \
#   --retries=5 \
#   CMD healthcheck

# Runtime

ENTRYPOINT [ "entrypoint" ]
CMD ["directus", "start"]

#
# Runtime image
#

FROM base AS runtime

VOLUME "/directus/packages"
VOLUME "/directus/node_modules"

#
# Onbuild image
#

FROM base AS onbuild

ENV ENTRYPOINT_INSTALL="false"

ONBUILD COPY package*.json /tmp/
ONBUILD COPY directus*.json /tmp/
ONBUILD RUN install
