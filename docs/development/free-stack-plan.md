# Free stack plan — $0, no credit card

No Oracle. No Fly.io (card). No home computer. Uses **Supabase + Upstash** (you already have these) plus a **free host that doesn't ask for a card**.

---

## Architecture

```text
┌─────────────────────┐         ┌─────────────────────────────────────────┐
│  Android phone      │  HTTPS  │  Render free OR Koyeb free ($0, no card)│
│  LocalSite APK      │ ──────► │  API + workers (fetch crawler)          │
└─────────────────────┘         └──────────────┬──────────────────────────┘
                                               │
                    ┌──────────────────────────┴──────────────────────────┐
                    ▼                          ▼                          │
            ┌───────────────┐          ┌───────────────┐                  │
            │  Supabase     │          │  Upstash      │                  │
            │  Postgres $0  │          │  Redis $0     │                  │
            └───────────────┘          └───────────────┘                  │
```

| Piece | Service | Card? | Cost |
|-------|---------|-------|------|
| Postgres | **Supabase** (you have) | No | $0 |
| Redis | **Upstash** (you have) | No | $0 |
| API + workers | **Render free** or **Koyeb free** | **No** | $0 |
| Phone app | APK | No | $0 |

---

## Quick start (you're halfway done)

You already created Supabase + Upstash. Finish in ~20 min:

### 1. Get full connection strings

See [no-card-hosting.md](./no-card-hosting.md) — you need passwords from each dashboard.

### 2. Migrate database (once)

```bash
export DATABASE_URL='postgresql://postgres:PASSWORD@db.ycpppvzfmwirfjzwzmzd.supabase.co:5432/postgres?sslmode=require'
git clone -b cursor/android-apk-browser-history-5128 https://github.com/zowskyy/elesoh
cd elesoh && pnpm install && pnpm db:migrate
```

### 3. Deploy app (no card)

**Render (easiest):** https://dashboard.render.com → Web Service → Docker → set `DATABASE_URL` + `REDIS_URL`

Uses `render.free.yaml` in the repo.

**Or Koyeb:** https://app.koyeb.com → GitHub → Dockerfile `infrastructure/docker/cloud-lite.Dockerfile`

Full steps: [no-card-hosting.md](./no-card-hosting.md)

### 4. Phone

- APK: https://github.com/zowskyy/elesoh/raw/cursor/android-apk-browser-history-5128/releases/LocalSiteOptimizer-debug.apk
- **Settings** → your Render/Koyeb HTTPS URL → Save
- **History** → Analyze

---

## Free tier behavior

| Host | Sleep? | Wake time |
|------|--------|-----------|
| Render free | After ~15 min idle | ~30s |
| Koyeb free | After ~1 hr idle | ~15–30s |

First request after sleep feels slow — normal on free tiers.

---

## Alternatives

| Path | Card? | Notes |
|------|-------|-------|
| Render free | No | Recommended |
| Koyeb free | Usually no | Docker from GitHub |
| Termux on phone | No | No cloud host; see no-card-hosting.md |
| Fly.io | Yes | Skipped |
| Oracle VM | No | Skipped (you don't want Oracle) |

---

## Files

| File | Purpose |
|------|---------|
| `render.free.yaml` | Render free deploy blueprint |
| `infrastructure/docker/cloud-lite.Dockerfile` | Small image, fetch crawler |
| `docs/development/no-card-hosting.md` | Step-by-step with your Supabase/Upstash |
| `docs/development/supabase.md` | Supabase details |

---

## Summary

**Plan:** Your Supabase + Your Upstash + Render/Koyeb (no card) + APK = **$0**.

**Next:** [no-card-hosting.md](./no-card-hosting.md) → deploy on Render.
