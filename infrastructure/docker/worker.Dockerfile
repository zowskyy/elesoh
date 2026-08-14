# syntax=docker/dockerfile:1

FROM node:22-bookworm AS base
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/mcp/package.json apps/mcp/
COPY packages/ai/package.json packages/ai/
COPY packages/audits/package.json packages/audits/
COPY packages/config/package.json packages/config/
COPY packages/crawler/package.json packages/crawler/
COPY packages/database/package.json packages/database/
COPY packages/discovery/package.json packages/discovery/
COPY packages/domain/package.json packages/domain/
COPY packages/logging/package.json packages/logging/
COPY packages/performance/package.json packages/performance/
COPY packages/queue/package.json packages/queue/
COPY packages/reports/package.json packages/reports/
COPY packages/repositories/package.json packages/repositories/
COPY packages/schemas/package.json packages/schemas/
COPY packages/scoring/package.json packages/scoring/
COPY packages/security/package.json packages/security/
COPY packages/services/package.json packages/services/
RUN pnpm install --frozen-lockfile

FROM base AS worker
COPY --from=deps /app /app
COPY . .
RUN pnpm --filter @lso/crawler exec playwright install --with-deps chromium
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@lso/worker", "start"]
