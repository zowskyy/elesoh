# Fly.io deploy — free stack

Part of [free-stack-plan.md](./free-stack-plan.md). No Oracle required.

---

## Prerequisites

| Service | Sign up | You need |
|---------|---------|----------|
| Supabase | https://supabase.com | `DATABASE_URL` |
| Upstash | https://upstash.com | `REDIS_URL` |
| Fly.io | https://fly.io | account + CLI |

Neon works instead of Supabase — same steps, swap the Postgres URL.

---

## Deploy script (easiest)

```bash
git clone -b cursor/android-apk-browser-history-5128 https://github.com/zowskyy/elesoh
cd elesoh

export FLY_APP_NAME=lso-optimizer-yourname
export DATABASE_URL='postgresql://...supabase...?sslmode=require'
export REDIS_URL='rediss://...upstash...'

bash scripts/deploy/fly-free-deploy.sh
```

Phone **Settings** → `https://lso-optimizer-yourname.fly.dev`

---

## Manual steps

```bash
fly auth login
fly apps create lso-optimizer-yourname
fly volumes create lso_reports --size 1 --region iad -a lso-optimizer-yourname --yes
fly secrets set \
  DATABASE_URL="postgresql://..." \
  REDIS_URL="rediss://..." \
  -a lso-optimizer-yourname
fly deploy -a lso-optimizer-yourname
```

---

## Migrations

The Fly container runs `pnpm db:migrate` on startup. If tables are missing:

```bash
export DATABASE_URL='...'
cd elesoh && pnpm install && pnpm db:migrate
```

Use Supabase **Session** or **Direct** connection for migrations, not Transaction pooler (port 6543).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Deploy fails OOM | Already using `cloud-lite` (fetch crawler) — should fit 512 MB |
| 502 after idle | Wait 30s — Fly machine waking up |
| DB connection error | Add `?sslmode=require` to Supabase URL |
| Redis TLS error | Use Upstash `rediss://` URL (double s) |
| Crawl fails on SPA sites | Expected with fetch crawler — no JS execution |

---

## Costs

Stay on free tiers = **$0**. Fly may ask for a card; you are not charged if usage stays within free allowance.
