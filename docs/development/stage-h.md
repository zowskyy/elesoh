# Stage H — Commercialization

Status: **PASS** (customer path + plan catalog; billing/accounts deferred)

## Scope

- Customer path: enter URL → crawl → SEO audit → score → top 10 issues → HTML report
- `POST /analyze` creates/reuses business+website and enqueues crawl
- `GET /reports/:id/content` serves generated report files
- `GET /plans` Free / Pro / Agency catalog (not enforced)
- Web: `/analyze` flow + Settings plans page

## Deferred

Accounts, login, Stripe billing, schedules, bulk, white-label enforcement, API keys.

## Smoke

```text
[x] typecheck
[x] plans unit test
[x] GET /plans returns three tiers
[x] Analyze UI at /analyze (requires API + worker + crawlable URL)
```
