# CONTEXT

Last updated: 2026-08-13

## Current

Stage **G — Production** is PASS. Next is Stage **H — Commercialization**.

## Runtime

- Queues: `crawl`, `audit`, `report`, `discovery`
- Discovery providers: `imported`, `osm` (Nominatim + Overpass)
- Opportunity: no website=100, unaudited site=80, else `100 - auditOverall`
- Product MCP (`@lso/mcp`): stdio tools for businesses/crawls/audits/opportunities/jobs; Zod 4 local to apps/mcp
- Developer Redis MCP remains separate in `.cursor/mcp.json` (pinned `redis-mcp-server==0.5.1`)
- Health: `/health/live` (liveness), `/health/ready` (postgres+redis), `/health` (detailed)
- Compose app stack: `api`, `worker`, `web`, `ollama` (+ postgres/redis); smoke via `pnpm smoke:prod`
