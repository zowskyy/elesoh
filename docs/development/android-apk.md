# Android APK — Browser History Optimizer

Install the mobile app to analyze websites from your phone, including URLs pulled from Android browser history.

## Cloud mode (recommended — no computer, $0)

Deploy a **free** backend (Fly.io + Neon + Upstash, or Oracle Cloud). See [cloud-hosting-free.md](./cloud-hosting-free.md).

No Render payment. After deploy, open **Settings** in the app and paste your API URL.

## Local mode (optional)

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
