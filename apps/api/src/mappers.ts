import type { Business, Crawl, Job, Website } from '@lso/domain';
import type { BusinessDto, CrawlDto, JobDto, WebsiteDto } from '@lso/schemas';

export function toBusinessDto(business: Business): BusinessDto {
  return {
    id: business.id,
    organizationId: business.organizationId,
    name: business.name,
    category: business.category,
    phone: business.phone,
    websiteUrl: business.websiteUrl,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
  };
}

export function toWebsiteDto(website: Website): WebsiteDto {
  return {
    id: website.id,
    businessId: website.businessId,
    url: website.url,
    createdAt: website.createdAt.toISOString(),
    updatedAt: website.updatedAt.toISOString(),
  };
}

export function toCrawlDto(crawl: Crawl): CrawlDto {
  return {
    id: crawl.id,
    websiteId: crawl.websiteId,
    status: crawl.status,
    startedAt: crawl.startedAt?.toISOString() ?? null,
    completedAt: crawl.completedAt?.toISOString() ?? null,
    createdAt: crawl.createdAt.toISOString(),
    updatedAt: crawl.updatedAt.toISOString(),
  };
}

export function toJobDto(job: Job): JobDto {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    idempotencyKey: job.idempotencyKey,
    payload: job.payload,
    attempts: job.attempts,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    error: job.error,
  };
}
