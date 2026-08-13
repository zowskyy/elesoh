# Project State

Current stage: **A — Infrastructure Foundation** (PASS with local fallback infra).

Original 34-phase numbering is retained only as notes. Implementation stages:

| Stage | Name | Status |
| --- | --- | --- |
| A | Infrastructure Foundation | PASS |
| B | Website Intelligence | not started |
| C | Audit Engine | not started |
| D | AI + Reporting | not started |
| E | Business Discovery | not started |
| F | Agent/MCP Layer | not started |
| G | Production | not started |
| H | Commercialization | not started |

## Stage A pass gate

```text
[x] pnpm install succeeds
[!] docker compose up -d succeeds  — Docker Desktop installed; WSL upgrade needs admin (REGDB_E_CLASSNOTREG). Fallback used: embedded-postgres + portable Redis 5.
[x] PostgreSQL accepts connections
[x] Redis accepts connections
[x] migrations apply successfully
[x] seed succeeds
[x] API starts
[x] worker starts
[x] web starts
[x] GET /health returns PostgreSQL OK
[x] GET /health returns Redis OK
[x] Business can be created
[x] Business can be listed
[x] Business survives API restart
[x] Worker can connect to Redis
[x] lso:health:started_at exists
[!] Redis MCP can read the key — `.cursor/mcp.json` uses `py -3 -m uv tool run --from redis-mcp-server==0.5.1 ...`; reload Cursor MCP; key verified via redis-cli as `2026-08-13T21:20:06.507Z`
[x] lint passes
[x] typecheck passes
[x] unit tests pass
[x] integration tests pass
[x] production builds pass
```

## Local infra note (Windows)

Preferred: `docker compose up -d` once WSL is fixed with an elevated `wsl --update` / `winget install Microsoft.WSL`.

**Blocker:** Docker Desktop is installed, but WSL is broken (`REGDB_E_CLASSNOTREG`), so compose was not used for Stage A verification.

Temporary Stage A verification used (documented in README “Without Docker”):

- `node scripts/setup/start-embedded-postgres.mjs`
- `tools/redis/redis-server.exe` (tporadowski Redis 5.0.14)

These are developer fallbacks only. Compose remains the contract.

Follow-up (2026-08-13): `GET http://localhost:3001/health` still returned postgres + redis `ok` under that fallback.

## Phase notes (internal)

- Stage A covers original phases 1–6 (environment, monorepo, config, domain, PostgreSQL, API health/CRUD).
- Stage B: phases 7–9 (URL/SSRF, crawler, evidence) plus crawl job HTTP.
- Stage C: phases 10–15, 22 (rules, performance, aggregator, scoring, recommendations, workers).
- Stage D: phases 16–18 (Ollama, AI safety, HTML/PDF reports).
- Stage E: phases 19–21 (discovery, opportunity, dashboard).
- Stage F: phases 23–24 (product MCP).
- Stage G: phases 25–30 (tests, observability, compose prod sim, deploy).
- Stage H: phases 31–34 and 57–63 (customer workflow, commercial layer).
