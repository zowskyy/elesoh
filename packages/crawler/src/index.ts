import { crawlWebsite as crawlWebsitePlaywrightImpl } from './crawl.js';
import { crawlWebsiteFetch } from './fetch-crawl.js';
import type { CrawlResult, CrawlerSettings } from './types.js';

export type CrawlerEngine = 'playwright' | 'fetch';

export async function crawlWebsite(
  seedInput: string,
  settings: CrawlerSettings & { engine?: CrawlerEngine },
): Promise<CrawlResult> {
  if (settings.engine === 'fetch') {
    return crawlWebsiteFetch(seedInput, settings);
  }
  return crawlWebsitePlaywrightImpl(seedInput, settings);
}

export { crawlWebsiteFetch } from './fetch-crawl.js';
export { extractPage } from './extract.js';
export { extractHtmlPage } from './extract-html.js';
export type {
  CrawlResult,
  CrawlerSettings,
  ExtractedHeading,
  ExtractedImage,
  ExtractedLink,
  PageExtraction,
} from './types.js';
