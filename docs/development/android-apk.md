# Android APK — Browser History Optimizer

Install the mobile app to analyze websites from your phone, including URLs pulled from Android browser history.

## Windows desktop (recommended — no cloud)

Run everything on your PC with Docker. See [windows-desktop.md](./windows-desktop.md).

Double-click **`Install LocalSite Optimizer.bat`** once, then **`LocalSite Optimizer.bat`** daily. The app opens at http://localhost:3000.

For phone access on the same Wi‑Fi, set `VITE_API_URL=http://YOUR_PC_IP:3001` before building the APK.

## Cloud mode (optional — phone only, no PC)

Deploy a free backend (Supabase + Upstash + Render/Koyeb). See [no-card-hosting.md](./no-card-hosting.md).

After deploy, open **Settings** in the app and paste your API URL. Or rebuild with:

```bash
VITE_CLOUD_API_URL=https://your-api.onrender.com pnpm --filter @lso/web android:apk:cloud
```

## Local LAN mode (optional)

If you self-host on your computer instead:

```bash
export VITE_API_URL=http://192.168.1.50:3001
```

Or create `apps/web/.env.production`:

```env
VITE_API_URL=http://192.168.1.50:3001
```

Start the backend on your machine:

```bash
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

## Build debug APK

```bash
pnpm install
pnpm --filter @lso/web android:apk
```

APK output:

`apps/web/android/app/build/outputs/apk/debug/app-debug.apk`

Or download a prebuilt APK from `releases/LocalSiteOptimizer-debug.apk` in this repo.

Transfer to your phone and install (enable “Install unknown apps” if prompted).

## Browser history permission

On first launch, open **History** in the app sidebar and grant **browser history** permission when prompted. The app reads recent `http`/`https` visits (deduped by hostname) and sends them through the **Taylor worker batch pipeline**:

1. `POST /analyze/batch` fans out crawl jobs to BullMQ workers
2. Taylor orchestrator advances each URL through audit → report on poll
3. Results show scores, top issues, and HTML report links

If history permission is denied (common on newer Chrome-only setups), paste URLs or use **Import from clipboard**.

## Release APK (optional)

Generate a signing keystore, configure `apps/web/android/app/build.gradle`, then:

```bash
pnpm --filter @lso/web android:apk:release
```

## Taylor worker multitask

Batch analyze uses the existing BullMQ worker queues (`crawl`, `audit`, `report`). Multiple sites are queued concurrently; workers process jobs in parallel across queue types while the Taylor orchestrator (`TaylorBatchService`) chains each site through the full pipeline.
