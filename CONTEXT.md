# CONTEXT

Last updated: 2026-08-13

## Current

Stage **C — Audit Engine** is PASS. Next is Stage **D — AI + Reporting**.

## Runtime

- Queues: `crawl`, `audit` (`lso:bull`)
- Audit ruleset: `AUDIT_RULESET_VERSION=seo-v1`
- Performance optional via `PERFORMANCE_ENABLED`

## Key packages

- `@lso/audits`, `@lso/scoring`, `@lso/performance`
- `@lso/services` — `AuditService`
