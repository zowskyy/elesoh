# Project State

Current stage: **C — Audit Engine** (PASS).

Original 34-phase numbering is retained only as notes. Implementation stages:

| Stage | Name | Status |
| --- | --- | --- |
| A | Infrastructure Foundation | PASS |
| B | Website Intelligence | PASS |
| C | Audit Engine | PASS |
| D | AI + Reporting | not started |
| E | Business Discovery | not started |
| F | Agent/MCP Layer | not started |
| G | Production | not started |
| H | Commercialization | not started |

## Stage C pass gate

```text
[x] 50 deterministic SEO rules (packages/audits)
[x] scoring package (AI does not set the number)
[x] performance wrapper returns ERROR when unavailable; SEO continues
[x] recommendations from impact * confidence / effort
[x] RUN_SEO_AUDIT / RUN_FULL_AUDIT jobs on audit queue
[x] POST /websites/:id/audits → 202; GET audit/findings/score/recommendations
[x] typecheck + 19 tests pass
[x] smoke: audit completed crawl → overall=92, 88 findings, 12 recommendations
```

## Stage B pass gate (retained)

```text
[x] SSRF/crawler/evidence + crawl job HTTP
```

## Stage A pass gate (retained)

```text
[x] monorepo, compose/fallback infra, health, CRUD, Redis namespaces
```

## Notes

- SEO audit requires a completed crawl for the website.
- `PERFORMANCE_ENABLED=false` by default; full audits still complete with PERF `ERROR` findings.
- Playwright browsers must be installed for new crawls (`pnpm --filter @lso/crawler exec playwright install chromium`).

## Phase notes (internal)

- Stage D next: Ollama AI explanations + HTML/PDF reports (AI cannot create findings/scores).
