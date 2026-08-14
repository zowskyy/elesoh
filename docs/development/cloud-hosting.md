# Cloud hosting (optional)

**Primary path:** [windows-desktop.md](./windows-desktop.md) — run Postgres, Redis, and the app locally on Windows with Docker. No cloud account needed.

Use cloud hosting only if you want the **Android APK without keeping a PC running**.

## Guides

| Doc | When |
|-----|------|
| [windows-desktop.md](./windows-desktop.md) | **Main guide** — local Windows app |
| [no-card-hosting.md](./no-card-hosting.md) | Phone-only — Supabase + Upstash + Render/Koyeb, no card |
| [free-stack-plan.md](./free-stack-plan.md) | Architecture overview |
| [supabase.md](./supabase.md) | Supabase Postgres |
| [fly-deploy.md](./fly-deploy.md) | Fly.io (requires card — optional) |
| [oracle-cloud.md](./oracle-cloud.md) | Oracle VM (optional) |

## Phone-only architecture

```text
Phone (APK)  →  HTTPS  →  Render/Koyeb web service (API + worker)
                              ├── Postgres (Supabase or managed)
                              ├── Redis (Upstash or managed)
                              └── /app/reports disk
```

- **No Ollama** in cloud — reports use the deterministic AI fallback (same scores/findings).
- **Taylor batch workers** run in the same container as the API (shared report disk).
- Set your API URL in the app **Settings**, or bake it in at APK build time with `VITE_CLOUD_API_URL`.

## One-time setup (from phone or any browser)

1. Create Supabase Postgres and Upstash Redis (free tiers).
2. Deploy the Docker service on [Render](https://dashboard.render.com) or Koyeb with those env vars.
3. Confirm health: `https://your-api.onrender.com/health`
4. Open the APK → **Settings** → paste your API URL.

See [no-card-hosting.md](./no-card-hosting.md) for step-by-step instructions.

## What you never need with Windows desktop

- Supabase, Upstash, or Render accounts
- `pnpm dev` in a terminal (the `.bat` launcher handles it)
- LAN IP configuration for daily use

Double-click **`LocalSite Optimizer.bat`** and the browser opens automatically.
