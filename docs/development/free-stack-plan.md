# Free stack plan — $0 on your end

Everything below stays on **free tiers**. No Render, no home computer, no monthly bill.

---

## Recommended architecture (simplest)

One Oracle Cloud Always Free VM runs the **entire backend**. Your phone runs the APK.

```text
┌─────────────────────┐         ┌──────────────────────────────────────────┐
│  Android phone      │  HTTP   │  Oracle Cloud (Always Free, $0/mo)       │
│  LocalSite APK      │ ──────► │  ┌─────────┐ ┌───────┐ ┌─────────────┐  │
│  • History URLs     │         │  │ Postgres│ │ Redis │ │ API+Worker  │  │
│  • Batch analyze    │         │  │ (Docker)│ │(Docker│ │ Playwright  │  │
└─────────────────────┘         │  └─────────┘ └───────┘ └─────────────┘  │
                                │         port 3001 (open in firewall)     │
                                └──────────────────────────────────────────┘
```

| Piece | Where | Cost |
|-------|--------|------|
| Postgres | Docker on Oracle VM | $0 |
| Redis (job queue) | Docker on Oracle VM | $0 |
| API + Taylor workers | Docker on Oracle VM | $0 |
| Playwright crawls | Same VM | $0 |
| AI reports | Deterministic fallback (no Ollama) | $0 |
| Android app | APK sideload | $0 |
| Domain / HTTPS | Optional DuckDNS + IP (HTTP works) | $0 |

**Your only recurring cost: $0.**

---

## One-time setup checklist

Do this once (~45 min total, mostly waiting on builds).

### Phase 1 — Oracle VM (browser, ~15 min)

- [ ] Sign up: https://www.oracle.com/cloud/free/
- [ ] Create **Ampere A1** VM — Ubuntu 22.04, **2 OCPU / 12 GB RAM**
- [ ] Download SSH private key
- [ ] Note **Public IP**
- [ ] Security list: open **TCP 3001** from `0.0.0.0/0`

Guide: [oracle-cloud.md](./oracle-cloud.md)

### Phase 2 — Install backend (SSH once, ~25 min)

```bash
ssh -i your-key.key ubuntu@YOUR_PUBLIC_IP

export POSTGRES_PASSWORD='long-random-password'
curl -fsSL https://raw.githubusercontent.com/zowskyy/elesoh/cursor/android-apk-browser-history-5128/scripts/deploy/oracle-cloud-install.sh | bash
```

Save the printed URL: `http://YOUR_PUBLIC_IP:3001`

### Phase 3 — Phone (~5 min)

- [ ] Install APK:  
  https://github.com/zowskyy/elesoh/raw/cursor/android-apk-browser-history-5128/releases/LocalSiteOptimizer-debug.apk
- [ ] Test in Chrome: `http://YOUR_PUBLIC_IP:3001/health`
- [ ] App → **Settings** → paste API URL → **Save**
- [ ] **History** → select sites → **Analyze**

**Done.** No computer needed after Phase 2.

---

## Optional upgrades (still $0)

Use these only if you want extras — **not required**.

| Want | Free service | Replaces on VM | Compose file |
|------|--------------|----------------|--------------|
| SQL dashboard + backups UI | [Supabase](https://supabase.com) Postgres | Docker Postgres | `docker-compose.oracle-supabase.yml` |
| Redis elsewhere | [Upstash](https://upstash.com) | Docker Redis | set `REDIS_URL` secret/env |
| Memorable hostname | [DuckDNS](https://duckdns.org) | Raw IP | point subdomain → VM IP |
| Lighter deploy (no Playwright) | Fly.io + Neon + Upstash | Whole Oracle VM | [cloud-hosting-free.md](./cloud-hosting-free.md) Option A |

Default plan: **keep Postgres + Redis on Oracle** — fewer accounts, one bill ($0).

---

## What we deliberately skip (paid or heavy)

| Skipped | Why |
|---------|-----|
| Render Standard | ~$25/mo |
| Ollama / cloud GPU | Not needed — fallback narratives work |
| Stripe / billing | Deferred |
| Custom domain + HTTPS | Optional; HTTP + IP works with APK |
| Your home PC 24/7 | Replaced by Oracle VM |

---

## Free tier limits to know

| Service | Limit | Impact |
|---------|-------|--------|
| Oracle Always Free | 4 OCPU / 24 GB RAM total across A1 VMs | 2 OCPU + 12 GB is enough |
| Oracle | VM stops if account idle/abused — rare | Keep instance running |
| Supabase (if used) | 500 MB DB, may pause when idle | Fine for personal use |
| Upstash (if used) | 10k commands/day free | Enough for moderate use |
| Fly.io (alt path) | Sleeps when idle, 512 MB RAM | Fetch crawler only |

---

## Daily use (after setup)

1. Open APK on phone (any network)
2. **History** or **Analyze** — backend on Oracle does the work
3. View scores + open HTML reports in browser

No laptop. No Wi‑Fi pairing with home network.

---

## Maintenance (rare)

On the VM:

```bash
cd ~/elesoh
docker compose -f docker-compose.oracle.yml logs -f app    # debug
docker compose -f docker-compose.oracle.yml up -d          # after reboot
git pull && docker compose -f docker-compose.oracle.yml up -d --build  # update
```

---

## Decision tree

```text
Want full Playwright crawls?
  YES → Oracle all-in-one (this plan) ✅
  NO  → Fly.io + Neon + Upstash (fetch only, still $0)

Want Supabase dashboard for data?
  YES → Oracle + Supabase Postgres (see supabase.md)
  NO  → Oracle Postgres in Docker (default)

Want HTTPS / pretty URL?
  YES → DuckDNS + reverse proxy (future doc)
  NO  → http://IP:3001 in Settings (works today)
```

---

## Files in this repo

| File | Purpose |
|------|---------|
| `docker-compose.oracle.yml` | Default free stack (Postgres + Redis + app) |
| `docker-compose.oracle-supabase.yml` | Oracle app + Supabase Postgres |
| `scripts/deploy/oracle-cloud-install.sh` | One-command VM install |
| `docs/development/oracle-cloud.md` | Step-by-step Oracle guide |
| `docs/development/supabase.md` | Optional Supabase Postgres |
| `releases/LocalSiteOptimizer-debug.apk` | Phone app |

---

## Summary

**Plan:** One Oracle Always Free VM + Android APK = **$0/month**, no home computer.

**Your next step:** [oracle-cloud.md](./oracle-cloud.md) Phase 1 — create the VM.
