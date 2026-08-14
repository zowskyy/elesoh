#!/usr/bin/env bash
# Deploy LocalSite Optimizer to Fly.io — $0 stack (no Oracle).
# Prerequisites: Supabase (or Neon) Postgres + Upstash Redis URLs ready.
set -euo pipefail

APP_NAME="${FLY_APP_NAME:-}"
BRANCH="${LSO_BRANCH:-cursor/android-apk-browser-history-5128}"

if [[ -z "$APP_NAME" ]]; then
  echo "Usage: FLY_APP_NAME=lso-optimizer-you DATABASE_URL='...' REDIS_URL='...' bash fly-free-deploy.sh"
  echo ""
  echo "Get free credentials first (browser only):"
  echo "  Postgres: https://supabase.com or https://neon.tech"
  echo "  Redis:    https://upstash.com"
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]] || [[ -z "${REDIS_URL:-}" ]]; then
  echo "Set DATABASE_URL and REDIS_URL before running."
  exit 1
fi

if ! command -v fly >/dev/null 2>&1; then
  echo "Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

echo "==> Logging in to Fly (browser may open)..."
fly auth login

echo "==> Creating app $APP_NAME (skip if exists)..."
fly apps create "$APP_NAME" 2>/dev/null || true

echo "==> Creating report volume (skip if exists)..."
fly volumes create lso_reports --size 1 --region iad -a "$APP_NAME" --yes 2>/dev/null || true

echo "==> Setting secrets..."
fly secrets set \
  DATABASE_URL="$DATABASE_URL" \
  REDIS_URL="$REDIS_URL" \
  -a "$APP_NAME"

echo "==> Deploying (first deploy ~5–10 min)..."
fly deploy -a "$APP_NAME" --remote-only

echo ""
echo "=============================================="
echo " LocalSite Optimizer is live on Fly.io"
echo "=============================================="
echo ""
echo " API URL for your phone:"
echo "   https://${APP_NAME}.fly.dev"
echo ""
echo " Health:"
echo "   https://${APP_NAME}.fly.dev/health"
echo ""
echo " Android app → Settings → paste URL → Save"
echo ""
