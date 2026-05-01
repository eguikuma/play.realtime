# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
RUN apk update \
  && apk upgrade --no-cache \
  && apk add --no-cache libc6-compat \
  && corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/transport-protocol/package.json packages/transport-protocol/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.base.json biome.json ./
COPY packages packages
COPY apps/backend apps/backend
RUN pnpm -F @play.realtime/contracts -F @play.realtime/transport-protocol run build
RUN pnpm -F @play.realtime/backend run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/backend
EXPOSE 4000
CMD ["node", "dist/main.js"]
