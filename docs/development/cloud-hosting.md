# Cloud hosting — no local computer

Use the Android app without running Postgres, Redis, or the API on your computer. The backend runs on **Render** (or any Docker host) and the APK talks to it over HTTPS.

## Architecture

```text
Phone (APK)  →  HTTPS  →  Render web service (API + worker + Playwright)
                              ├── Postgres (managed)
                              ├── Redis (managed)
                              └── /app/reports disk
```

- **No Ollama** in cloud — reports use the deterministic AI fallback (same scores/findings).
- **Taylor batch workers** run in the same container as the API (shared report disk).
- APK defaults to `https://lso-optimizer-api.onrender.com`.

## One-time setup (from phone or any browser)

You only do this once — not on your computer.

1. Ensure this repo is on GitHub (`zowskyy/elesoh`).
2. Open **[Render Blueprint](https://dashboard.render.com/blueprint/new)** on your phone or laptop.
3. Connect GitHub and select the `elesoh` repo.
4. Render reads `render.yaml` and creates:
   - Postgres (`lso-db`)
   - Redis (`lso-redis`)
   - Web service `lso-optimizer-api` (API + worker)
5. Wait for the deploy to finish (~10–15 min first build; Playwright install is slow).
6. Confirm health: `https://lso-optimizer-api.onrender.com/health`

## Install the app

Download the cloud APK (defaults to the Render URL):

https://github.com/zowskyy/elesoh/raw/cursor/android-apk-browser-history-5128/releases/LocalSiteOptimizer-debug.apk

Open the app → **Dashboard** should show **Cloud mode**. Go to **History**, grant browser history permission, select sites, **Analyze**.

## Costs (Render, approximate)

| Resource | Plan | Notes |
|----------|------|-------|
| Postgres | Free | Expires after 90 days on free tier — upgrade for production |
| Redis | Free | Fine for queue/cache |
| API+worker | Standard (~$25/mo) | Playwright/Chromium needs RAM; free tier is too small |

Free web tier spins down after inactivity — first request after idle can take 30–60s (cold start).

## Self-host alternative (VPS)

```bash
docker compose -f docker-compose.cloud.yml up -d --build
```

Point the APK at your VPS URL in **Settings**, or rebuild with:

```bash
VITE_CLOUD_API_URL=https://your-domain.com pnpm --filter @lso/web android:apk:cloud
```

## Custom cloud URL

If your Render service has a different name, rebuild the APK:

```bash
VITE_CLOUD_API_URL=https://your-api.onrender.com pnpm --filter @lso/web android:apk:cloud
```

Or set the URL in **Settings** on the phone (no rebuild).

## What you never need again

- `pnpm dev` on your computer
- LAN IP configuration
- Docker Desktop on your PC
- Phone and PC on the same Wi‑Fi

After Render is deployed, the phone only needs internet.
