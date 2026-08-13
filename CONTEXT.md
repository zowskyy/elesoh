# CONTEXT

Last updated: 2026-08-13

## Current

Stage **B — Website Intelligence** is PASS. Next is Stage **C — Audit Engine** (deterministic SEO rules, scoring, findings).

## Runtime

- Compose: postgres:16 + redis:7
- API `:3001`, worker on BullMQ queue `crawl` (`lso:bull` prefix)
- Dev fixture crawl requires `CRAWLER_ALLOW_LOCALHOST=true` and `node scripts/development/fixture-site.mjs`

## Key packages

- `@lso/security` — normalizeUrl / validateCrawlUrl (SSRF)
- `@lso/crawler` — Playwright crawl + page extract
- `@lso/services` — CrawlService enqueue + execute
