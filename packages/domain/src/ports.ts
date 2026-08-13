import type {
  AuditRun,
  AuditScore,
  Business,
  Crawl,
  CreateBusinessInput,
  CreateJobInput,
  CreateWebsiteInput,
  Finding,
  FindingOutcome,
  Job,
  Recommendation,
  Report,
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
  findLatestCompleted(websiteId: string): Promise<Crawl | null>;
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

export interface CrawlPageSnapshot {
  pageId: string;
  url: string;
  statusCode: number | null;
  evidenceId: string;
  seo: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    robotsMeta: string | null;
    viewport: string | null;
    language: string | null;
    openGraph: Record<string, string>;
    requestedUrl?: string;
  };
  headings: Array<{ level: number; text: string }>;
  links: Array<{ href: string }>;
  images: Array<{ src: string; alt: string | null }>;
}

export interface PageRepository {
  insertExtractedPages(crawlId: string, pages: PageEvidenceWrite[]): Promise<number>;
  listSnapshotsByCrawl(crawlId: string): Promise<CrawlPageSnapshot[]>;
}

export interface AuditRepository {
  create(input: {
    websiteId: string;
    crawlId: string | null;
    mode: 'seo' | 'full';
    version: string;
  }): Promise<AuditRun>;
  findById(id: string): Promise<AuditRun | null>;
  markRunning(id: string): Promise<AuditRun>;
  markCompleted(id: string): Promise<AuditRun>;
  markFailed(id: string): Promise<AuditRun>;
}

export interface FindingWrite {
  auditRunId: string;
  evidenceId: string;
  ruleId: string;
  outcome: FindingOutcome;
  summary: string;
}

export interface FindingRepository {
  insertMany(findings: FindingWrite[]): Promise<Finding[]>;
  listByAudit(auditRunId: string): Promise<Finding[]>;
}

export interface RecommendationWrite {
  findingId: string;
  priority: string;
  action: string;
}

export interface RecommendationRepository {
  insertMany(rows: RecommendationWrite[]): Promise<Recommendation[]>;
  listByAudit(auditRunId: string): Promise<Recommendation[]>;
}

export interface ScoreRepository {
  upsert(input: {
    auditRunId: string;
    overall: number;
    seo: number;
    performance: number | null;
    categories: Record<string, number>;
  }): Promise<AuditScore>;
  findByAudit(auditRunId: string): Promise<AuditScore | null>;
}

export interface ReportRepository {
  create(input: { auditRunId: string; format: string; path: string }): Promise<Report>;
  findById(id: string): Promise<Report | null>;
  listByAudit(auditRunId: string): Promise<Report[]>;
}
