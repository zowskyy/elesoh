# Cloud hosting — $0 / no Render

Use the Android app **without your computer** and **without paying Render**.

Two free options:

| Option | Cost | Crawler | Best for |
|--------|------|---------|----------|
| **A. Fly.io + Neon + Upstash** | $0 | HTTP fetch (lighter) | Quick setup from laptop once |
| **B. Oracle Cloud Always Free VM** | $0 forever | Full Playwright | Best audits, more setup |

---

## Option A — Fly.io stack (recommended, $0)

Uses managed free Postgres (Neon) and Redis (Upstash). The app runs on Fly.io’s free allowance with a **fetch crawler** (no Chromium — still runs SEO audits).

### 1. Free database & Redis (5 min, browser only)

**Neon Postgres (free):**
1. https://neon.tech → sign up
2. Create project → copy connection string (`postgres://...`)

**Upstash Redis (free):**
1. https://upstash.com → sign up
2. Create Redis database → copy `REDIS_URL` (`rediss://...`)

### 2. Deploy API to Fly.io (one-time, needs a terminal)

Install [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) on any machine (borrow a laptop once, or use GitHub Codespaces free):

```bash
git clone https://github.com/zowskyy/elesoh
cd elesoh
fly auth login
fly apps create lso-optimizer-YOURNAME   # pick a unique name
fly volumes create lso_reports --size 1 --region iad
fly secrets set \
  DATABASE_URL="postgres://..." \
  REDIS_URL="rediss://..."
fly deploy
```

Your API URL: `https://lso-optimizer-YOURNAME.fly.dev`

Health check: `https://lso-optimizer-YOURNAME.fly.dev/health`

### 3. Phone setup

1. Install APK:  
   https://github.com/zowskyy/elesoh/raw/cursor/android-apk-browser-history-5128/releases/LocalSiteOptimizer-debug.apk
2. Open **Settings** → paste your Fly URL → **Save**
3. **History** → select sites → **Analyze**

After this, you never need your computer again.

### Fly.io free tier notes

- Machines sleep when idle; first request after sleep may take ~15–30s
- 512MB RAM is enough for fetch crawler
- Neon free tier: 0.5GB storage, projects may pause when idle

---

## Option B — Oracle Cloud Always Free ($0 forever)

Run the **full stack** including Playwright on a free ARM VM (24GB RAM total across VMs).

1. https://www.oracle.com/cloud/free/ → create account
2. Create an **Ampere A1** VM (Ubuntu 22.04, 4 OCPU / 24GB RAM max on free tier)
3. Open ports 80/443 in security list
4. SSH in (or use Oracle Cloud Shell):

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
git clone https://github.com/zowskyy/elesoh
cd elesoh
export POSTGRES_PASSWORD=choose-a-strong-password
docker compose -f docker-compose.cloud.yml up -d --build
```

5. Point a free DuckDNS hostname at your VM IP (optional): https://www.duckdns.org
6. In the app **Settings**, set API URL to `http://YOUR_VM_IP:3001` or your DuckDNS URL

Full Playwright crawls; no monthly fee.

---

## What about Render?

Render’s **free web tier cannot run this worker** (too little RAM for Playwright). Paid Standard (~$25/mo) works but is optional. See `render.paid.yaml` if you want that later.

---

## APK cloud URL

The APK does **not** hardcode a paid host. On first launch:

1. **Settings** → enter your Fly or Oracle API URL
2. **Dashboard** confirms connection

Rebuild with your URL baked in (optional):

```bash
VITE_CLOUD_API_URL=https://lso-optimizer-YOURNAME.fly.dev pnpm android:apk:cloud
```

---

## What you never need

- Your computer running 24/7
- Render payment
- Same Wi‑Fi as your phone

You only need internet + your free cloud URL saved in the app.
