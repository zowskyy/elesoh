# Stage D — AI + Reporting

Status: **PASS**

## Scope

- `@lso/ai` — constrained Ollama narrator + fallback
- `@lso/reports` — HTML and minimal PDF renderers
- `ReportService` + `report` queue jobs `GENERATE_AI_REPORT` / `GENERATE_PDF`
- API: `POST /audits/:id/reports`, `GET /audits/:id/reports`, `GET /reports/:id`

## Safety

AI may only explain provided findings/scores. Invented rule IDs are stripped. Scores come from Stage C only.

## Smoke

HTML + PDF + narrative JSON generated for a completed audit with `AI_ENABLED=false` (fallback narrator).
