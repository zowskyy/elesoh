# Project State

Current stage: **B — Website Intelligence** (PASS).

Original 34-phase numbering is retained only as notes. Implementation stages:

| Stage | Name | Status |
| --- | --- | --- |
| A | Infrastructure Foundation | PASS |
| B | Website Intelligence | PASS |
| C | Audit Engine | not started |
| D | AI + Reporting | not started |
| E | Business Discovery | not started |
| F | Agent/MCP Layer | not started |
| G | Production | not started |
| H | Commercialization | not started |

## Stage B pass gate

```text
[x] security unit tests pass (normalizeUrl + SSRF; allowLocalhost opt-in)
[x] typecheck/build pass
[x] enqueue crawl returns 202
[x] worker completes crawl (fixture http://127.0.0.1:4173/ with CRAWLER_ALLOW_LOCALHOST=true)
[x] pages + evidence stored in Postgres (2 pages, page.seo evidence)
[x] Playwright extract IIFE fix (string evaluate must invoke)
[x] Chromium DNS MAP via Node lookup for public hosts
[x] empty crawl fails the job (no silent COMPLETED with 0 pages)
```

## Stage A pass gate (retained)

```text
[x] pnpm install, migrate, seed, API/worker/web, health, CRUD, Redis health key
[x] Docker Compose postgres:16 + redis:7 healthy after WSL recovery
```

## Local infra note (Windows)

Preferred: `docker compose up -d` (working as of 2026-08-13 after WSL recovery).

Fallback remains: embedded-postgres + portable Redis under `tools/` / `data/` (gitignored).

Dev crawl smoke: `node scripts/development/fixture-site.mjs` + `CRAWLER_ALLOW_LOCALHOST=true` (never enable against untrusted URLs).

## Phase notes (internal)

- Stage A covers original phases 1–6 (environment, monorepo, config, domain, PostgreSQL, API health/CRUD).
- Stage B: phases 7–9 (URL/SSRF, crawler, evidence) plus crawl job HTTP — **done**.
- Stage C: phases 10–15, 22 (rules, performance, aggregator, scoring, recommendations, workers).
- Stage D: phases 16–18 (Ollama, AI safety, HTML/PDF reports).
- Stage E: phases 19–21 (discovery, opportunity, dashboard).
- Stage F: phases 23–24 (product MCP).
- Stage G: phases 25–30 (tests, observability, compose prod sim, deploy).
- Stage H: phases 31–34 and 57–63 (customer workflow, commercial layer).
