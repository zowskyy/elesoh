# LocalSite Optimizer

Local SEO and website intelligence platform. PostgreSQL is the durable source of truth. Redis holds temporary operational state (queue, locks, cache, progress).

## Stage A — Infrastructure Foundation

This repository currently implements Stage A only: config, domain, database, queue, REST API (health + business/website CRUD), worker Redis ping, and a Vite dashboard shell.

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker
- (Developer Redis MCP) `uv` / `uvx` for `redis-mcp-server==0.5.1`

## Quick start (Windows desktop — recommended)

Personal use: everything local, no cloud. See [docs/development/windows-desktop.md](docs/development/windows-desktop.md).

1. Install Node 22+ and Docker Desktop
2. Double-click **`Install LocalSite Optimizer.bat`** (once)
3. Double-click **`LocalSite Optimizer.bat`** (starts server + opens http://localhost:3000)

Or from PowerShell:

```powershell
pnpm desktop:install   # once
pnpm desktop:start     # daily
```

## Quick start (developers)

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Web: http://localhost:3000
- API health: http://localhost:3001/health
- Live / ready: http://localhost:3001/health/live · http://localhost:3001/health/ready

Full stack (api + worker + web + ollama images):

```powershell
docker compose up -d --build
pnpm smoke:prod
```

### Without Docker (local fallback)

If Docker Desktop cannot start (for example WSL `REGDB_E_CLASSNOTREG` until an elevated `wsl --update`), use this temporary fallback instead of `docker compose up -d`:

```powershell
# Terminal A — portable Redis (tools/redis from tporadowski Redis 5.0.14)
.\tools\redis\redis-server.exe .\tools\redis\redis.windows.conf

# Terminal B — embedded Postgres
node scripts/setup/start-embedded-postgres.mjs

# Then migrate / seed / dev as above
```

Compose remains the supported contract once WSL/Docker works. See also [PROJECT_STATE.md](PROJECT_STATE.md) for the Stage A verification note.

## Verification

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

See [PROJECT_STATE.md](PROJECT_STATE.md) for the Stage A pass gate and later stages.
