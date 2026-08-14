import { describe, expect, it } from 'vitest';

const baseUrl = process.env['API_BASE_URL'];

describe.runIf(baseUrl !== undefined && baseUrl.length > 0)('production smoke e2e', () => {
  it('live and ready succeed against a running API', async () => {
    const live = await fetch(`${baseUrl}/health/live`);
    expect(live.status).toBe(200);
    const ready = await fetch(`${baseUrl}/health/ready`);
    expect(ready.status).toBe(200);
  });
});
