import { lookup } from 'node:dns/promises';
import { setDefaultResultOrder } from 'node:dns';
import { isIP } from 'node:net';
import { chromium, type Browser } from 'playwright';
import { sameRegistrableHost, validateCrawlUrl } from '@lso/security';
import { extractPage } from './extract.js';
import type { CrawlResult, CrawlerSettings, PageExtraction } from './types.js';

setDefaultResultOrder('ipv4first');

interface QueueItem {
  url: string;
  depth: number;
}

async function chromiumDnsArgs(hostname: string): Promise<string[]> {
  if (isIP(hostname) !== 0 || hostname === 'localhost') {
    return [];
  }
  try {
    const record = await lookup(hostname, { family: 4 });
    return [`--host-resolver-rules=MAP ${hostname} ${record.address}`];
  } catch {
    return [];
  }
}

export async function crawlWebsite(
  seedInput: string,
  settings: CrawlerSettings,
): Promise<CrawlResult> {
  const allowLocalhost = settings.allowLocalhost === true;
  const seed = await validateCrawlUrl(seedInput, { allowLocalhost });
  const dnsArgs = await chromiumDnsArgs(seed.hostname);
  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--disable-http2', ...dnsArgs],
  });
  const pages: PageExtraction[] = [];
  const seen = new Set<string>();
  const queue: QueueItem[] = [{ url: seed.toString(), depth: 0 }];
  const errors: string[] = [];

  async function visit(item: QueueItem): Promise<void> {
    if (pages.length >= settings.maxPages || seen.has(item.url)) {
      return;
    }
    seen.add(item.url);

    let target: URL;
    try {
      target = await validateCrawlUrl(item.url, { allowLocalhost });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'url validation failed');
      return;
    }
    if (!sameRegistrableHost(seed, target)) {
      return;
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(settings.navigationTimeoutMs);
    try {
      const response = await page.goto(target.toString(), { waitUntil: 'domcontentloaded' });
      const extraction = await extractPage(page, target.toString());
      extraction.statusCode = response?.status() ?? null;
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
      errors.push(
        `${target.toString()}: ${error instanceof Error ? error.message : 'navigation failed'}`,
      );
    } finally {
      await context.close();
    }
  }

  try {
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
  } finally {
    await browser.close();
  }

  if (pages.length === 0) {
    throw new Error(
      `Crawl produced no pages for ${seed.toString()}. ${errors.slice(0, 3).join('; ')}`,
    );
  }

  return { seedUrl: seed.toString(), pages };
}
