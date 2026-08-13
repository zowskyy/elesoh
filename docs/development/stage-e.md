# Stage E — Business Discovery

Status: **PASS**

## Scope

- `@lso/discovery` — imported + OSM providers, normalize/dedupe, verify, opportunity score
- `DiscoveryService` + `discovery` queue (`DISCOVER_BUSINESSES`)
- API: `POST /discoveries`, `GET /discoveries/:id`, `GET /opportunities`
- Web: `/discovery` page with import JSON / OSM form + opportunity ranking

## Smoke

Imported discovery completed with `created=2`, `verified=1`; `/opportunities` returns ranked rows.
