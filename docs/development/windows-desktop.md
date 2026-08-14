# Windows desktop — personal local software

Run everything on your Windows PC. **No Supabase, Upstash, Render, Oracle, or credit card.**

Postgres + Redis run in **Docker Desktop**. The app opens in your browser at http://localhost:3000.

---

## Architecture

```text
Double-click "LocalSite Optimizer.bat"
        │
        ├─► Docker: Postgres + Redis (local)
        ├─► API + Worker + Web (Node on your PC)
        └─► Browser opens → Analyze / History / Reports
```

| Piece | Where | Cost |
|-------|--------|------|
| Postgres | Docker on PC | $0 |
| Redis | Docker on PC | $0 |
| API + Playwright worker | Your PC | $0 |
| UI | Browser localhost:3000 | $0 |
| Cloud services | None | $0 |

**PC must be on** while you use the app. Data stays in Docker volumes on your machine.

---

## Prerequisites (one time)

1. **Windows 10/11**
2. **Node.js 22+** — https://nodejs.org/
3. **Docker Desktop** — https://www.docker.com/products/docker-desktop/  
   - Enable WSL2 backend if prompted
   - Docker must be **running** before you start the app

---

## Install (one time)

1. Clone or download this repo
2. Double-click **`Install LocalSite Optimizer.bat`**

This will:
- Install npm dependencies
- Install Playwright Chromium (for crawls)
- Start Postgres + Redis in Docker
- Run database migrations + seed

Takes ~10–20 minutes first time (Playwright download).

---

## Daily use

1. Open **Docker Desktop** (wait until it says Running)
2. Double-click **`LocalSite Optimizer.bat`**
3. Browser opens to http://localhost:3000 automatically
4. Use **Analyze** or **History** as usual

A second window titled **"LocalSite Optimizer — Server"** runs the backend.  
**Close that window to stop** the API and worker.

Docker Postgres/Redis keep running until you run `docker compose down` or quit Docker Desktop.

---

## What each file does

| File | Purpose |
|------|---------|
| `Install LocalSite Optimizer.bat` | First-time setup |
| `LocalSite Optimizer.bat` | Start app (daily launcher) |
| `scripts/windows/Install-LocalSiteOptimizer.ps1` | Install logic |
| `scripts/windows/Start-LocalSiteOptimizer.ps1` | Start Docker + servers + open browser |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Docker not running | Open Docker Desktop, wait for green status, retry |
| Port 5432/6379 in use | Stop other Postgres/Redis or change ports in `.env` + `docker-compose.yml` |
| Browser doesn't open | Go to http://localhost:3000 manually |
| Crawl fails | Re-run install (Playwright): `pnpm --filter @lso/crawler exec playwright install chromium` |
| WSL / Docker errors | Run `wsl --update` in Admin PowerShell, restart |

### Without Docker (fallback)

If Docker won't start, see [README.md](../../README.md) — embedded Postgres + portable Redis scripts.

---

## Phone APK with local PC

Optional: while your PC is on and on the same Wi‑Fi, set the APK **Settings** API URL to `http://YOUR_LAN_IP:3001`.  
Default plan is **Windows desktop only** — use the browser on the same machine.

---

## Summary

**Install once → double-click to start → browser opens.**  
No cloud. No card. Everything local.
