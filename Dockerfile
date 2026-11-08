# syntax=docker/dockerfile:1
# Build tooling only. Production runs as a Cloudflare Worker, not a Node server.
FROM node:24-bookworm-slim AS dependencies

# The repository's security checker uses Git to enumerate source files.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

FROM dependencies AS build
ENV CI=true \
    WRANGLER_SEND_METRICS=false \
    WRANGLER_WRITE_LOGS=false

COPY --chown=node:node . .

# .git is excluded from the context. A temporary local index lets the existing
# security check inspect all build sources without copying repository history.
RUN git init --quiet \
    && git add --all \
    && npm run build \
    && rm -rf .git

CMD ["node", "scripts/docker-export.mjs", "/artifacts"]
