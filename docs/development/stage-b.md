# Stage B — Website Intelligence

Status: **PASS**

## Scope delivered

- URL normalization + SSRF (`packages/security`) with `allowLocalhost` opt-in for fixtures
- Playwright crawler (`packages/crawler`) with caps from config + Chromium DNS MAP
- Evidence persistence (pages, headings, links, images, `evidence.page.seo`)
- `POST /websites/:id/crawls` with idempotency (`202` when created)
- `GET /crawls/:id`, `GET /jobs/:id`
- Worker BullMQ processor for `CRAWL_WEBSITE`
- Fixture: `scripts/development/fixture-site.mjs` + `scripts/development/smoke-crawl-fixture.ts`

## Gate

```text
[x] security unit tests pass
[x] typecheck/build pass
[x] enqueue crawl returns 202
[x] worker completes crawl for local fixture (CRAWLER_ALLOW_LOCALHOST=true)
[x] pages + evidence stored in Postgres
```

## Verified smoke (2026-08-13)

- Enqueue → job `COMPLETED` / crawl `completed`
- Postgres: 2 pages; evidence titles `LSO Fixture Home`, `About Fixture`
- Unit/integration: 15/15 passing
