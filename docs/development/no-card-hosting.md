# No credit card — hosting guide

You already have **Supabase** and **Upstash** (both free, no card). You only need a place to run the API + worker **without Fly.io** (Fly asks for a card).

---

## Your stack

| Service | You have | Card? |
|---------|----------|-------|
| Postgres | Supabase ✅ | No |
| Redis | Upstash ✅ | No |
| API + worker | **Pick below** | **No** |
| Phone app | APK | No |

---

## Get connection strings (Supabase + Upstash)

You shared project hosts — you still need **passwords** from each dashboard (never paste those in chat).

**Supabase** (`ycpppvzfmwirfjzwzmzd`):
1. Supabase → **Project Settings → Database**
2. Copy **URI** (Session mode)
3. Format:
```env
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db.ycpppvzfmwirfjzwzmzd.supabase.co:5432/postgres?sslmode=require
```

**Upstash** (`discrete-stag-122746`):
1. Upstash → your database → **Connect**
2. Copy **Redis URL** (`rediss://...`)
```env
REDIS_URL=rediss://default:YOUR_TOKEN@discrete-stag-122746.upstash.io:6379
```

Run migrations once (Codespaces / any terminal):
```bash
export DATABASE_URL='...'
git clone -b cursor/android-apk-browser-history-5128 https://github.com/zowskyy/elesoh
cd elesoh && pnpm install && pnpm db:migrate
```

---

## Option 1 — Render free (recommended, no card)

Render free tier: **no credit card**, 512 MB, sleeps after ~15 min idle (~30s wake).

### Deploy (browser + GitHub)

1. Push `elesoh` to your GitHub (or use `zowskyy/elesoh` branch)
2. https://dashboard.render.com → **Sign up** (no card for free tier)
3. **New → Blueprint** → connect repo → Render reads `render.free.yaml`
   - Or **New → Web Service** → Docker → point at `infrastructure/docker/cloud-lite.Dockerfile`
4. Add environment variables:
   - `DATABASE_URL` = your Supabase URI
   - `REDIS_URL` = your Upstash URL
5. Deploy → note URL: `https://lso-optimizer.onrender.com` (or your service name)

### Phone

**Settings** → `https://lso-optimizer.onrender.com` → Save

---

## Option 2 — Koyeb free (no card)

Koyeb: Docker from GitHub, scales to zero after 1h idle, usually **no card**.

1. https://app.koyeb.com → sign up
2. **Create App → Web Service → GitHub**
3. Repo: `elesoh`, branch: `cursor/android-apk-browser-history-5128`
4. Builder: **Dockerfile** → `infrastructure/docker/cloud-lite.Dockerfile`
5. Port: **3001**
6. Environment:
   - `DATABASE_URL`, `REDIS_URL` (same as above)
   - `API_PORT=3001`, `CRAWLER_ENGINE=fetch`, `AI_ENABLED=false`
7. Instance: **Free** (512 MB)
8. Deploy → URL like `https://your-app-org.koyeb.app`

---

## Option 3 — Backend on your phone (Termux, zero cloud host)

No hosting account at all. Phone runs API + worker; data in Supabase/Upstash.

1. Install **Termux** from F-Droid
2. In Termux:
```bash
pkg install nodejs git
git clone -b cursor/android-apk-browser-history-5128 https://github.com/zowskyy/elesoh
cd elesoh
export DATABASE_URL='...supabase...'
export REDIS_URL='...upstash...'
export CRAWLER_ENGINE=fetch
pnpm install
pnpm db:migrate
pnpm --filter @lso/api start &
pnpm --filter @lso/worker start
```
3. APK **Settings** → `http://127.0.0.1:3001`

Downside: backend stops when Termux is killed; best for testing.

---

## What we skip

| Service | Why |
|---------|-----|
| Fly.io | Card required for most signups |
| Oracle | You don't want it |
| Render paid | ~$25/mo |

---

## Security note

You posted Supabase/Upstash hostnames in chat. If this is public, **rotate your database password and Upstash token** in each dashboard.

---

## Summary

**Easiest no-card path:** Supabase + Upstash (done) + **Render free** or **Koyeb** + APK.

Next step: [Render dashboard](https://dashboard.render.com) → deploy with your two env vars.
