import { validateCrawlUrl } from '@lso/security';
import type { WebsiteVerification } from './types.js';

export async function verifyWebsite(
  url: string,
  options: { allowLocalhost?: boolean; timeoutMs?: number } = {},
): Promise<WebsiteVerification> {
  try {
    const normalized = await validateCrawlUrl(url, {
      allowLocalhost: options.allowLocalhost === true,
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8_000);
    try {
      const response = await fetch(normalized.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'LocalSiteOptimizer-Verify/0.1' },
      });
      return {
        url: normalized.toString(),
        ok: response.status >= 200 && response.status < 400,
        statusCode: response.status,
        error: null,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return {
      url,
      ok: false,
      statusCode: null,
      error: error instanceof Error ? error.message : 'verification failed',
    };
  }
}
