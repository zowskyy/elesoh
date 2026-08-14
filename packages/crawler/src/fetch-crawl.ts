import { sameRegistrableHost, validateCrawlUrl } from '@lso/security';
import { extractHtmlPage } from './extract-html.js';
import type { CrawlResult, CrawlerSettings, PageExtraction } from './types.js';

interface QueueItem {
  url: string;
  depth: number;
}

async function fetchPage(
  url: string,
  timeoutMs: number,
  allowLocalhost: boolean,
): Promise<{ html: string; finalUrl: string; statusCode: number | null }> {
  const target = await validateCrawlUrl(url, { allowLocalhost });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'LocalSiteOptimizer/0.1 (+https://github.com/zowskyy/elesoh)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error(`Unsupported content type: ${contentType || 'unknown'}`);
    }
    const html = await response.text();
    return {
      html,
      finalUrl: response.url || target.toString(),
      statusCode: response.status,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function crawlWebsiteFetch(
  seedInput: string,
  settings: CrawlerSettings,
): Promise<CrawlResult> {
  const allowLocalhost = settings.allowLocalhost === true;
  const seed = await validateCrawlUrl(seedInput, { allowLocalhost });
  const pages: PageExtraction[] = [];
  const seen = new Set<string>();
  const queue: QueueItem[] = [{ url: seed.toString(), depth: 0 }];
  const errors: string[] = [];

  async function visit(item: QueueItem): Promise<void> {
    if (pages.length >= settings.maxPages || seen.has(item.url)) {
      return;
    }
    seen.add(item.url);

    try {
      const fetched = await fetchPage(item.url, settings.navigationTimeoutMs, allowLocalhost);
      const target = new URL(fetched.finalUrl);
      if (!sameRegistrableHost(seed, target)) {
        return;
      }
      const extraction = extractHtmlPage(fetched.html, item.url, fetched.finalUrl, fetched.statusCode);
      pages.push(extraction);

      if (item.depth < settings.maxDepth) {
        for (const link of extraction.links) {
          try {
            const href = await validateCrawlUrl(link.href, { allowLocalhost });
            const key = href.toString();
            if (sameRegistrableHost(seed, href) && !seen.has(key)) {
              queue.push({ url: key, depth: item.depth + 1 });
            }
          } catch {
            /* skip */
          }
        }
      }
    } catch (error) {
      errors.push(`${item.url}: ${error instanceof Error ? error.message : 'fetch failed'}`);
    }
  }

  while (queue.length > 0 && pages.length < settings.maxPages) {
    const batch: QueueItem[] = [];
    while (batch.length < settings.concurrency && queue.length > 0) {
      const next = queue.shift();
      if (next !== undefined && !seen.has(next.url)) {
        batch.push(next);
      }
    }
    if (batch.length === 0) {
      break;
    }
    await Promise.all(batch.map((item) => visit(item)));
  }

  if (pages.length === 0) {
    throw new Error(
      `Crawl produced no pages for ${seed.toString()}. ${errors.slice(0, 3).join('; ')}`,
    );
  }

  return { seedUrl: seed.toString(), pages };
}
