# CONTEXT

Last updated: 2026-08-13

## Current

Stage **H — Commercialization** customer path + plan catalog is PASS. Billing/accounts remain deferred.

## Runtime

- Queues: `crawl`, `audit`, `report`, `discovery`
- Customer entry: `POST /analyze` + web `/analyze` (URL → score → top 10 → report content URL)
- Plans: Free / Pro / Agency via `GET /plans` (catalog only)
- Health: `/health/live`, `/health/ready`, `/health`
- Product MCP + developer Redis MCP unchanged
