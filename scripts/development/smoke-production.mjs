/**
 * Production smoke — hit a running API (compose or local `pnpm --filter @lso/api start`).
 *
 *   $env:API_BASE_URL = "http://127.0.0.1:3001"
 *   pnpm smoke:prod
 */

const baseUrl = (process.env['API_BASE_URL'] ?? 'http://127.0.0.1:3001').replace(/\/$/, '');

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'x-request-id': `smoke-${Date.now()}` },
  });
  const body = await response.json();
  return { status: response.status, body, requestId: response.headers.get('x-request-id') };
}

async function main() {
  const live = await getJson('/health/live');
  if (live.status !== 200) {
    throw new Error(`live failed: ${live.status} ${JSON.stringify(live.body)}`);
  }

  const ready = await getJson('/health/ready');
  if (ready.status !== 200) {
    throw new Error(`ready failed: ${ready.status} ${JSON.stringify(ready.body)}`);
  }

  const health = await getJson('/health');
  if (health.status !== 200) {
    throw new Error(`health failed: ${health.status} ${JSON.stringify(health.body)}`);
  }

  if (live.requestId === null || live.requestId.length === 0) {
    throw new Error('missing x-request-id on live response');
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        live: live.body,
        ready: ready.body,
        health: health.body,
        requestId: live.requestId,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
