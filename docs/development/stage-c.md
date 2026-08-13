# Stage C — Audit Engine

Status: **PASS**

## Scope delivered

- `@lso/audits` — 50 deterministic SEO rules (`PASS|WARN|FAIL|NOT_APPLICABLE|ERROR`)
- `@lso/scoring` — weighted deterministic score (AI never sets the number)
- `@lso/performance` — sitespeed wrapper; returns `ERROR` when disabled/unavailable so SEO continues
- Recommendation priority = `impact * confidence / effort`
- Migration `0001_audit_scores` (`audit_scores`, `audit_runs.crawl_id`, `audit_runs.mode`)
- `POST /websites/:id/audits` (`seo` | `full`) with idempotency
- `GET /audits/:id`, `/findings`, `/recommendations`, `/score`
- Worker processors: `RUN_SEO_AUDIT`, `RUN_FULL_AUDIT` on queue `audit`

## Gate

```text
[x] 50 SEO rules registered + unit tests
[x] typecheck/build pass
[x] unit/integration tests pass (19)
[x] enqueue SEO audit returns 202
[x] worker completes audit against completed crawl evidence
[x] findings + score + recommendations stored in Postgres
```

## Verified smoke (2026-08-13)

- Existing fixture crawl `http://127.0.0.1:4173/`
- Audit `COMPLETED` with overall **92**, seo **92**, **88** findings, **12** recommendations
