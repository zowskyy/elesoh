# Stage F — Agent/MCP Layer

Status: **PASS**

## Scope

- `apps/mcp` on `@modelcontextprotocol/server` v2 (stdio)
- Product tools only: `list_businesses`, `get_business`, `enqueue_crawl`, `run_audit`, `get_audit`, `get_score`, `list_findings`, `list_opportunities`, `get_job`
- Never expose `execute_sql`, `fetch_any_url`, or Redis MCP surface
- `@lso/mcp` uses Zod 4 for MCP peer compatibility; rest of monorepo stays on Zod 3
- Cursor config: `.cursor/mcp.json` → `localsite-optimizer` (product) + pinned Redis MCP (developer)

## Smoke

```text
[x] pnpm --filter @lso/mcp typecheck
[x] vitest apps/mcp/src/server.test.ts (allowlist)
[x] createProductMcpServer registers exactly the 9 allowed tools
```
