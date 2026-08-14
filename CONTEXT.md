# CONTEXT

Last updated: 2026-08-13

## Current

Stage **F — Agent/MCP Layer** is PASS. Next is Stage **G — Production**.

## Runtime

- Queues: `crawl`, `audit`, `report`, `discovery`
- Discovery providers: `imported`, `osm` (Nominatim + Overpass)
- Opportunity: no website=100, unaudited site=80, else `100 - auditOverall`
- Product MCP (`@lso/mcp`): stdio tools for businesses/crawls/audits/opportunities/jobs; Zod 4 local to apps/mcp
- Developer Redis MCP remains separate in `.cursor/mcp.json` (pinned `redis-mcp-server==0.5.1`)
