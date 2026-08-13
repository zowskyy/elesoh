import type { Env } from '@lso/config';
import { crawlWebsite } from '@lso/crawler';
import type {
  Crawl,
  CrawlRepository,
  Job,
  JobRepository,
  PageRepository,
  WebsiteRepository,
} from '@lso/domain';
import type { Queue } from 'bullmq';
import { NotFoundError } from './errors.js';
import { JobService } from './job-service.js';

export const CRAWL_QUEUE_NAME = 'crawl';
export const CRAWL_JOB_NAME = 'CRAWL_WEBSITE';

export class CrawlService {
  public constructor(
    private readonly websites: WebsiteRepository,
    private readonly crawls: CrawlRepository,
    private readonly pages: PageRepository,
    private readonly jobs: JobRepository,
    private readonly jobService: JobService,
    private readonly queue: Queue,
    private readonly env: Env,
  ) {}

  public async enqueueCrawl(
    websiteId: string,
    idempotencyKey?: string,
  ): Promise<{ job: Job; crawl: Crawl; created: boolean }> {
    const website = await this.websites.findById(websiteId);
    if (website === null) {
      throw new NotFoundError(`Website not found: ${websiteId}`);
    }

    const key = idempotencyKey ?? `crawl:${websiteId}:${website.url}`;
    const existingJob = await this.jobs.findByIdempotencyKey(key);
    if (existingJob !== null) {
      const crawlId = existingJob.payload['crawlId'];
      if (typeof crawlId === 'string') {
        const crawl = await this.crawls.findById(crawlId);
        if (crawl !== null) {
          return { job: existingJob, crawl, created: false };
        }
      }
    }

    const crawl = await this.crawls.create(websiteId);
    const { job, created } = await this.jobService.createIfAbsent({
      type: 'CRAWL_WEBSITE',
      idempotencyKey: key,
      payload: {
        websiteId,
        crawlId: crawl.id,
        url: website.url,
      },
    });

    if (created) {
      await this.queue.add(
        CRAWL_JOB_NAME,
        {
          jobId: job.id,
          websiteId,
          crawlId: crawl.id,
          url: website.url,
        },
        {
          jobId: job.id,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    }

    return { job, crawl, created };
  }

  public async getCrawl(id: string): Promise<Crawl> {
    const crawl = await this.crawls.findById(id);
    if (crawl === null) {
      throw new NotFoundError(`Crawl not found: ${id}`);
    }
    return crawl;
  }

  public async getJob(id: string): Promise<Job> {
    const job = await this.jobs.findById(id);
    if (job === null) {
      throw new NotFoundError(`Job not found: ${id}`);
    }
    return job;
  }

  public async executeCrawlJob(input: {
    jobId: string;
    crawlId: string;
    url: string;
  }): Promise<{ pageCount: number }> {
    await this.jobs.markRunning(input.jobId);
    await this.crawls.markRunning(input.crawlId);

    try {
      const result = await crawlWebsite(input.url, {
        maxPages: this.env.CRAWLER_MAX_PAGES,
        maxDepth: this.env.CRAWLER_MAX_DEPTH,
        concurrency: this.env.CRAWLER_CONCURRENCY,
        navigationTimeoutMs: this.env.CRAWLER_TIMEOUT,
        allowLocalhost: this.env.CRAWLER_ALLOW_LOCALHOST,
      });

      const pageCount = await this.pages.insertExtractedPages(
        input.crawlId,
        result.pages.map((page) => ({
          url: page.finalUrl || page.url,
          statusCode: page.statusCode,
          evidence: {
            title: page.title,
            description: page.description,
            canonical: page.canonical,
            robotsMeta: page.robotsMeta,
            viewport: page.viewport,
            language: page.language,
            openGraph: page.openGraph,
            requestedUrl: page.url,
          },
          headings: page.headings,
          links: page.links.map((link) => ({ href: link.href })),
          images: page.images,
        })),
      );

      await this.crawls.markCompleted(input.crawlId);
      await this.jobs.markCompleted(input.jobId);
      return { pageCount };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'crawl failed';
      await this.crawls.markFailed(input.crawlId);
      await this.jobs.markFailed(input.jobId, message);
      throw error;
    }
  }
}
