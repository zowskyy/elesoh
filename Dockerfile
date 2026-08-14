# syntax=docker/dockerfile:1

FROM node:22-bookworm AS base
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
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

FROM deps AS build
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN pnpm --filter @lso/web build

FROM base AS api
COPY --from=deps /app /app
COPY . .
ENV NODE_ENV=production
EXPOSE 3001
CMD ["sh", "-c", "pnpm db:migrate && pnpm --filter @lso/api start"]

FROM base AS worker
COPY --from=deps /app /app
COPY . .
RUN pnpm --filter @lso/crawler exec playwright install --with-deps chromium
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@lso/worker", "start"]

FROM nginx:1.27-alpine AS web
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY infrastructure/nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
