# Product MCP (Stage F)

stdio MCP server for LocalSite Optimizer application tools.

## Run

```bash
pnpm --filter @lso/mcp start
```

Requires the same `.env` as API/worker (`DATABASE_URL`, `REDIS_URL`, …).

## Tools (allowed)

- `list_businesses`, `get_business`
- `enqueue_crawl`
- `run_audit`, `get_audit`, `get_score`, `list_findings`
- `list_opportunities`
- `get_job`

## Never exposed

- `execute_sql`
- `fetch_any_url`
- Redis MCP / raw Redis commands
- shell execution

Developer Redis inspection stays in `.cursor/mcp.json` (`redis-mcp-server==0.5.1`), separate from this product MCP.
