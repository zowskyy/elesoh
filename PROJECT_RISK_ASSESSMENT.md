# Project Risk Assessment

## Stage A risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Domain coupled to Drizzle/Redis | High | Repository ports live in domain; implementations in `packages/repositories` and `packages/queue` |
| Duplicate crawl/audit work | High | `jobs.idempotency_key` unique; `JobService.createIfAbsent` |
| Redis treated as source of truth | High | Ownership rule: Redis is recoverable operational state; Postgres holds job history |
| Unpinned Redis MCP | Medium | Pin `redis-mcp-server==0.5.1`; document upgrades in `docs/development/redis-mcp.md` |
| SSRF when crawling begins | High | Deferred to Stage B by design; do not crawl in Stage A |
| Scattered `process.env` | Medium | All env access through `packages/config` except Drizzle Kit CLI |

## Later-stage risks (not in scope)

- Unrestricted Playwright crawls
- AI mutating findings or scores
- Product MCP exposing SQL/Redis/shell
- sitespeed.io output leaking into domain types
