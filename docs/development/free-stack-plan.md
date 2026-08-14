# Free stack plan — $0 on your end (no Oracle)

Everything stays on **free tiers**. No Oracle, no Render, no home computer, no monthly bill.

---

## Recommended architecture

Managed free services + Fly.io for the app. Your phone runs the APK.

```text
┌─────────────────────┐         ┌─────────────────────────────────────────┐
│  Android phone      │  HTTPS  │  Fly.io (free allowance, $0)            │
│  LocalSite APK      │ ──────► │  API + Taylor workers (fetch crawler)   │
└─────────────────────┘         └──────────────┬──────────────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
            ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
            │  Supabase     │          │  Upstash      │          │  Fly volume   │
            │  Postgres $0  │          │  Redis $0     │          │  reports $0   │
            └───────────────┘          └───────────────┘          └───────────────┘
```

| Piece | Service | Cost |
|-------|---------|------|
| Postgres | [Supabase](https://supabase.com) (or [Neon](https://neon.tech)) | $0 |
| Redis queue | [Upstash](https://upstash.com) | $0 |
| API + workers | [Fly.io](https://fly.io) | $0 (within free allowance) |
| HTTPS URL | `https://your-app.fly.dev` | $0 |
| Crawler | HTTP fetch (fits 512 MB RAM) | $0 |
| AI reports | Deterministic fallback | $0 |
| Android app | APK sideload | $0 |

**Total: $0/month**

> **Trade-off vs Oracle:** fetch crawler instead of Playwright — SEO audits still run, but no headless Chrome (some JS-heavy sites may score differently).

---

## One-time setup checklist

~30 min total (mostly browser + one terminal session).

### Phase 1 — Free accounts (browser, ~10 min)

Do all of this from your phone or laptop browser:

**1. Supabase Postgres**
- [ ] https://supabase.com → sign up → New project
- [ ] **Settings → Database → Connection string → URI** (Session mode)
- [ ] Copy URL, add `?sslmode=require` if missing

**2. Upstash Redis**
- [ ] https://upstash.com → sign up → Create database
- [ ] Copy **Redis URL** (`rediss://...`)

**3. Fly.io**
- [ ] https://fly.io → sign up (card may be required for verification; stay within free limits = $0)

Guide for Supabase URL format: [supabase.md](./supabase.md)

### Phase 2 — Deploy to Fly (terminal once, ~15 min)

Use any terminal once — laptop, library PC, or [GitHub Codespaces](https://github.com/codespaces) (free):

```bash
git clone -b cursor/android-apk-browser-history-5128 https://github.com/zowskyy/elesoh
cd elesoh

# Pick a unique app name (letters, numbers, hyphens)
export FLY_APP_NAME=lso-optimizer-YOURNAME
export DATABASE_URL='postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require'
export REDIS_URL='rediss://default:PASSWORD@REGION.upstash.io:6379'

bash scripts/deploy/fly-free-deploy.sh
```

Or manually:

```bash
fly auth login
fly apps create lso-optimizer-YOURNAME
fly volumes create lso_reports --size 1 --region iad -a lso-optimizer-YOURNAME --yes
fly secrets set DATABASE_URL="..." REDIS_URL="..." -a lso-optimizer-YOURNAME
fly deploy -a lso-optimizer-YOURNAME
```

Run migrations (first deploy usually handles via container startup, or run locally):

```bash
export DATABASE_URL='...'
pnpm db:migrate
```

Your API URL: **`https://lso-optimizer-YOURNAME.fly.dev`**

### Phase 3 — Phone (~5 min)

- [ ] Install APK:  
  https://github.com/zowskyy/elesoh/raw/cursor/android-apk-browser-history-5128/releases/LocalSiteOptimizer-debug.apk
- [ ] Test in Chrome: `https://lso-optimizer-YOURNAME.fly.dev/health`
- [ ] App → **Settings** → paste Fly URL → **Save**
- [ ] **History** → select sites → **Analyze**

**Done.** No computer needed after Phase 2.

---

## Free tier limits

| Service | Limit | What it means |
|---------|-------|---------------|
| Fly.io | Machine sleeps when idle | First request after sleep ~15–30s wake |
| Fly.io | 512 MB RAM on free/small VMs | Enough for fetch crawler |
| Supabase | 500 MB DB, 2 projects | Fine for personal use |
| Supabase | May pause after inactivity | Wake from dashboard |
| Upstash | 10k commands/day free | OK for moderate batch use |
| Neon (alt) | 0.5 GB, may pause | Same idea as Supabase |

---

## Daily use

1. Open APK (any network)
2. **History** or **Analyze**
3. If app feels slow first time, wait ~30s (Fly waking up)

---

## Maintenance

```bash
fly logs -a lso-optimizer-YOURNAME
fly deploy -a lso-optimizer-YOURNAME          # update
fly secrets set DATABASE_URL="..." -a ...     # rotate credentials
```

Browse crawl/audit data in **Supabase Table Editor**.

---

## Alternatives (still $0)

| If you… | Use |
|---------|-----|
| Prefer Neon over Supabase | Same steps — swap `DATABASE_URL` |
| Want Playwright (heavier) | Oracle VM — see [oracle-cloud.md](./oracle-cloud.md) (optional) |
| Want to self-host on PC | `docker compose up` on LAN (not phone-only) |

---

## What we skip

| Skipped | Why |
|---------|-----|
| Oracle | You chose not to use it |
| Render | ~$25/mo |
| Home PC 24/7 | Fly handles it |
| Ollama / GPU | Fallback narratives |

---

## Files in this repo

| File | Purpose |
|------|---------|
| `fly.toml` | Fly.io app config |
| `infrastructure/docker/cloud-lite.Dockerfile` | Small image, fetch crawler |
| `scripts/deploy/fly-free-deploy.sh` | One-command Fly deploy |
| `docs/development/supabase.md` | Supabase Postgres details |
| `releases/LocalSiteOptimizer-debug.apk` | Phone app |

---

## Summary

**Plan:** Supabase + Upstash + Fly.io + APK = **$0/month**, no Oracle, no home computer.

**Next step:** Create Supabase + Upstash accounts (Phase 1), then run `fly-free-deploy.sh` (Phase 2).
