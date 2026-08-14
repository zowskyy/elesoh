#!/usr/bin/env bash
# Oracle Cloud Always Free — one-command install for LocalSite Optimizer.
# Run on a fresh Ubuntu 22.04/24.04 Ampere VM as a normal user with sudo.
set -euo pipefail

REPO_URL="${LSO_REPO_URL:-https://github.com/zowskyy/elesoh.git}"
BRANCH="${LSO_BRANCH:-cursor/android-apk-browser-history-5128}"
INSTALL_DIR="${LSO_INSTALL_DIR:-$HOME/elesoh}"

if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  echo "Run as a normal user with sudo, not root."
  exit 1
fi

if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 16)"
  export POSTGRES_PASSWORD
  echo "Generated POSTGRES_PASSWORD (save this): $POSTGRES_PASSWORD"
fi

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y docker.io docker-compose-v2 git curl
  sudo usermod -aG docker "$USER"
  echo "Docker installed. If this is the first install, log out and back in, then re-run this script."
  if ! docker info >/dev/null 2>&1; then
    echo "Trying with newgrp docker..."
    exec sg docker "$0"
  fi
fi

echo "==> Cloning repository..."
if [[ -d "$INSTALL_DIR/.git" ]]; then
  git -C "$INSTALL_DIR" fetch origin "$BRANCH"
  git -C "$INSTALL_DIR" checkout "$BRANCH"
  git -C "$INSTALL_DIR" pull origin "$BRANCH" || true
else
  git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

echo "==> Building and starting stack (first build takes 15–25 min — Playwright + Chromium)..."
export POSTGRES_PASSWORD
docker compose -f docker-compose.oracle.yml up -d --build

echo "==> Waiting for API health..."
for i in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:3001/health/live" >/dev/null 2>&1; then
    break
  fi
  sleep 10
done

PUBLIC_IP="$(curl -sf ifconfig.me || curl -sf icanhazip.com || hostname -I | awk '{print $1}')"

echo ""
echo "=============================================="
echo " LocalSite Optimizer is running on Oracle Cloud"
echo "=============================================="
echo ""
echo " API URL for your phone:"
echo "   http://${PUBLIC_IP}:3001"
echo ""
echo " Health check:"
echo "   http://${PUBLIC_IP}:3001/health"
echo ""
echo " In the Android app:"
echo "   Settings → paste the API URL above → Save"
echo "   History → select sites → Analyze"
echo ""
echo " Useful commands (on this VM):"
echo "   cd $INSTALL_DIR"
echo "   docker compose -f docker-compose.oracle.yml logs -f app"
echo "   docker compose -f docker-compose.oracle.yml restart"
echo ""
echo " If the phone cannot connect, open port 3001 in Oracle:"
echo "   Networking → Virtual cloud network → Security list"
echo "   Add ingress: TCP 3001 from 0.0.0.0/0"
echo ""
