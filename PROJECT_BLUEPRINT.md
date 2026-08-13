# Project Blueprint

LocalSite Optimizer is a monorepo product, not a collection of scripts.

## Dependency direction

```text
web → schemas
api → application services → domain → repository interfaces
repositories → database → PostgreSQL
queue → Redis (prefix lso:bull)
```

`packages/domain` contains entities and ports only. It must not import Drizzle, Redis, BullMQ, Hono, or HTTP types.

## Data ownership

- **Redis:** temporary operational state (queue, locks, rate limits, frontier, cache, progress, health).
- **PostgreSQL:** anything the business cannot afford to lose (business, website, page, evidence, finding, audit, score, recommendation, report, job history).

If Redis disappears, the product recovers. If PostgreSQL disappears, historical knowledge is gone.

## Redis namespaces

```text
lso:health:*
lso:cache:*
lso:lock:*
lso:crawl:*
lso:progress:*
lso:rate:*
```

BullMQ prefix: `lso:bull`.

## Developer vs product MCP

```text
Developer: Cursor → Redis MCP (pinned redis-mcp-server==0.5.1) → localhost Redis
Product:   agent → LocalSite Optimizer MCP → application services → Postgres/Redis
```

Never expose Redis MCP through the product MCP server.

## HTTP flow

```text
HTTP → route → packages/services → domain → packages/repositories → Postgres
```

## Job idempotency

Jobs have `idempotency_key`. The same key returns the existing job and does not launch duplicate work.
