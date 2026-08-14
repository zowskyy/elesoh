import type { Business, Crawl, Job, Website, WebsiteRepository } from '@lso/domain';
import { normalizeUrl } from '@lso/security';
import type { BusinessService } from './business-service.js';
import type { CrawlService } from './crawl-service.js';
import type { WebsiteService } from './website-service.js';

export class AnalyzeService {
  public constructor(
    private readonly businesses: BusinessService,
    private readonly websites: WebsiteService,
    private readonly crawls: CrawlService,
    private readonly websiteRepo: WebsiteRepository,
  ) {}

  public async startFromUrl(
    rawUrl: string,
    options: {
      businessName?: string;
      idempotencyKey?: string;
      allowLocalhost?: boolean;
    } = {},
  ): Promise<{
    url: string;
    business: Business;
    website: Website;
    job: Job;
    crawl: Crawl;
    created: boolean;
  }> {
    const normalized = normalizeUrl(rawUrl, {
      allowLocalhost: options.allowLocalhost === true,
    });
    const url = normalized.href;
    const businessName = options.businessName?.trim() || normalized.hostname;

    let business = await this.businesses.findByWebsiteUrl(url);
    if (business === null) {
      business = await this.businesses.create({
        name: businessName,
        websiteUrl: url,
      });
    }

    let website = await this.websiteRepo.findByUrl(url);
    if (website === null) {
      website = await this.websites.create({ businessId: business.id, url });
    }

    const crawlResult = await this.crawls.enqueueCrawl(website.id, options.idempotencyKey);
    return {
      url,
      business,
      website,
      job: crawlResult.job,
      crawl: crawlResult.crawl,
      created: crawlResult.created,
    };
  }
}
