# Stage G — Production

Status: **PASS** (local verification; cloud hosting deferred until V0.1)

## Scope

- `GET /health/live` (process up) and `GET /health/ready` (postgres + redis)
- Structured pino logs with `x-request-id` correlation (API middleware + worker job child loggers)
- Provider failure isolation unchanged: AI fallback, discovery provider-run failures, health dependency probes
- Four test layers: unit / integration / e2e (opt-in) / smoke script
- `docker compose` stack: postgres, redis, ollama, api, worker, web
- `pnpm smoke:prod` against a running API

## Smoke

```powershell
# Infra + apps (or local pnpm --filter @lso/api start with compose postgres/redis)
docker compose up -d postgres redis
pnpm --filter @lso/api start   # separate terminal if not using full compose build
pnpm smoke:prod
```

Full app images: `docker compose up -d --build` (first build is slow: pnpm install + Playwright Chromium).
