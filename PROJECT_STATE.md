# Project State

Current stage: **G — Production** (PASS).

| Stage | Name | Status |
| --- | --- | --- |
| A | Infrastructure Foundation | PASS |
| B | Website Intelligence | PASS |
| C | Audit Engine | PASS |
| D | AI + Reporting | PASS |
| E | Business Discovery | PASS |
| F | Agent/MCP Layer | PASS |
| G | Production | PASS |
| H | Commercialization | not started |

## Stage G pass gate

```text
[x] GET /health/live + GET /health/ready (+ detailed /health)
[x] correlation IDs (x-request-id) on API; worker job child loggers
[x] docker compose: postgres + redis + ollama + api + worker + web
[x] four test layers (unit, integration, e2e opt-in, smoke:prod)
[x] typecheck + health/live/ready integration tests
[x] hosting deferred until after V0.1 customer path (Stage H)
```

## Next

Stage H — Commercialization (customer path, plans, accounts, billing).
