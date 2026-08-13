import type {
  Business,
  Crawl,
  CreateBusinessInput,
  CreateJobInput,
  CreateWebsiteInput,
  Job,
  UpdateBusinessInput,
  UpdateWebsiteInput,
  Website,
} from './entities.js';

export interface BusinessRepository {
  create(input: CreateBusinessInput): Promise<Business>;
  findById(id: string): Promise<Business | null>;
  listByOrganization(organizationId: string): Promise<Business[]>;
  update(id: string, input: UpdateBusinessInput): Promise<Business>;
  delete(id: string): Promise<void>;
}

export interface WebsiteRepository {
  create(input: CreateWebsiteInput): Promise<Website>;
  findById(id: string): Promise<Website | null>;
  listByBusiness(businessId: string): Promise<Website[]>;
  update(id: string, input: UpdateWebsiteInput): Promise<Website>;
  delete(id: string): Promise<void>;
}

export interface JobRepository {
  findById(id: string): Promise<Job | null>;
  findByIdempotencyKey(key: string): Promise<Job | null>;
  create(input: CreateJobInput): Promise<Job>;
  markRunning(id: string): Promise<Job>;
  markCompleted(id: string): Promise<Job>;
  markFailed(id: string, error: string): Promise<Job>;
}

export interface CrawlRepository {
  create(websiteId: string): Promise<Crawl>;
  findById(id: string): Promise<Crawl | null>;
  markRunning(id: string): Promise<Crawl>;
  markCompleted(id: string): Promise<Crawl>;
  markFailed(id: string): Promise<Crawl>;
}

export interface PageEvidenceWrite {
  url: string;
  statusCode: number | null;
  evidence: Record<string, unknown>;
  headings: Array<{ level: number; text: string }>;
  links: Array<{ href: string }>;
  images: Array<{ src: string; alt: string | null }>;
}

export interface PageRepository {
  insertExtractedPages(crawlId: string, pages: PageEvidenceWrite[]): Promise<number>;
}
