# Oracle Cloud Always Free — Option B ($0 forever)

Run the **full** LocalSite Optimizer stack (Playwright crawls, SEO audits, reports) on Oracle’s Always Free ARM VM. After setup, your phone never needs your computer.

**Cost:** $0/month (Always Free tier)

---

## Part 1 — Create the VM (phone or browser, ~15 min)

### 1. Sign up

1. Open https://www.oracle.com/cloud/free/
2. Create an account (credit card for verification; Always Free resources stay $0)

### 2. Create an Ampere VM

1. Oracle Console → **Compute** → **Instances** → **Create instance**
2. **Name:** `lso-optimizer`
3. **Image:** Ubuntu 22.04 or 24.04 (aarch64)
4. **Shape:** Ampere → **VM.Standard.A1.Flex**
   - OCPUs: **2** (or up to 4 on free tier)
   - Memory: **12 GB** (or up to 24 GB total across free VMs)
5. **Networking:** use default VCN
6. **SSH keys:** choose one:
   - **Generate a key pair** → download private key (needed to SSH from a terminal once)
   - Or paste your existing public key
7. **Boot volume:** 50–100 GB (free tier allows up to 200 GB total)
8. Click **Create**

Wait until state = **Running**. Copy the **Public IP address**.

### 3. Open port 3001 (required for phone)

1. On the instance page → click the **Subnet** link
2. Click the **Security list** for that subnet
3. **Add ingress rules:**

| Source CIDR | Protocol | Destination port |
|-------------|----------|------------------|
| `0.0.0.0/0`  | TCP      | 3001             |
| `0.0.0.0/0`  | TCP      | 22 (SSH, if not open) |

4. Save

---

## Part 2 — Install the app (one SSH session, ~20 min first build)

You need a terminal **once** — Oracle Cloud Shell (in the browser), a laptop, or Termius on your phone.

### Option: Oracle Cloud Shell (no local computer)

1. Oracle Console → **Cloud Shell** icon (top right)
2. Cloud Shell cannot SSH to your VM by default in all regions — if blocked, use Termius on your phone with your SSH key, or borrow any computer for 20 minutes.

### SSH into the VM

```bash
chmod 600 ~/Downloads/ssh-key-*.key   # your downloaded private key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_PUBLIC_IP
```

(Default user is `ubuntu` on Ubuntu images.)

### One-command install

```bash
export POSTGRES_PASSWORD='pick-a-long-random-password'
curl -fsSL https://raw.githubusercontent.com/zowskyy/elesoh/cursor/android-apk-browser-history-5128/scripts/deploy/oracle-cloud-install.sh | bash
```

Or clone and run:

```bash
git clone -b cursor/android-apk-browser-history-5128 https://github.com/zowskyy/elesoh
cd elesoh
export POSTGRES_PASSWORD='pick-a-long-random-password'
bash scripts/deploy/oracle-cloud-install.sh
```

The script installs Docker, builds the stack (Playwright + Chromium), and prints your API URL.

**First build takes 15–25 minutes** on Ampere — this is normal.

### Manual install (same result)

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
# log out and back in, then:
git clone -b cursor/android-apk-browser-history-5128 https://github.com/zowskyy/elesoh
cd elesoh
export POSTGRES_PASSWORD='your-password'
docker compose -f docker-compose.oracle.yml up -d --build
```

---

## Part 3 — Phone setup (2 min)

1. **Install APK:**  
   https://github.com/zowskyy/elesoh/raw/cursor/android-apk-browser-history-5128/releases/LocalSiteOptimizer-debug.apk

2. Open **Settings** → **Free cloud API URL**

3. Enter: `http://YOUR_PUBLIC_IP:3001`  
   Example: `http://129.146.XX.XX:3001`

4. Tap **Save API URL**

5. Open **Dashboard** — should show API / Postgres / Redis healthy

6. **History** → grant browser history → select sites → **Analyze**

You’re done. The VM runs 24/7 on Oracle’s free tier.

---

## Verify from phone browser

Before opening the app, test in Chrome on your phone:

`http://YOUR_PUBLIC_IP:3001/health`

You should see JSON with `"status":"ok"`. If not, recheck the security list (port 3001).

---

## Optional — free hostname (DuckDNS)

Raw IPs work with the app (HTTP cleartext enabled). For a memorable URL:

1. https://www.duckdns.org → create subdomain pointing to your VM IP
2. Use `http://yoursub.duckdns.org:3001` in Settings

HTTPS with Let’s Encrypt requires a reverse proxy (Caddy/nginx) — ask if you want that added.

---

## Maintenance (on the VM)

```bash
cd ~/elesoh

# View logs
docker compose -f docker-compose.oracle.yml logs -f app

# Restart after reboot (containers use restart: unless-stopped)
docker compose -f docker-compose.oracle.yml up -d

# Update to latest code
git pull
docker compose -f docker-compose.oracle.yml up -d --build
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Phone can’t reach API | Open port **3001** in Oracle security list |
| `health` works on VM but not phone | Security list or wrong public IP |
| Build fails (out of memory) | Use VM with **12 GB+ RAM**, 2+ OCPUs |
| Crawl jobs fail | Check `docker compose ... logs -f app` for Playwright errors |
| After VM reboot | Run `docker compose -f docker-compose.oracle.yml up -d` |

---

## What you get on free tier

- Full **Playwright** website crawls (better than fetch-only)
- Taylor batch workers (History page)
- SEO scores + HTML reports
- **No Render bill**, no home computer
