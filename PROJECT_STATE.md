# Project State

Current stage: **F — Agent/MCP Layer** (PASS).

| Stage | Name | Status |
| --- | --- | --- |
| A | Infrastructure Foundation | PASS |
| B | Website Intelligence | PASS |
| C | Audit Engine | PASS |
| D | AI + Reporting | PASS |
| E | Business Discovery | PASS |
| F | Agent/MCP Layer | PASS |
| G | Production | not started |
| H | Commercialization | not started |

## Stage F pass gate

```text
[x] apps/mcp on @modelcontextprotocol/server v2 (stdio)
[x] product tools: list_businesses, get_business, enqueue_crawl, run_audit, get_audit, get_score, list_findings, list_opportunities, get_job
[x] never execute_sql / fetch_any_url / Redis MCP surface
[x] Zod 4 only in @lso/mcp (MCP peer); monorepo Zod 3 elsewhere
[x] typecheck + allowlist unit test
[x] smoke: registered tools match allowlist (9 tools)
```

## Next

Stage G — Production (health live/ready, compose app stack, correlation IDs, smoke).
