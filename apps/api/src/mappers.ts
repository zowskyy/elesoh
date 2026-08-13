import type {
  AuditRun,
  AuditScore,
  Business,
  Crawl,
  Finding,
  Job,
  OpportunityRow,
  ProviderRun,
  Recommendation,
  Report,
  Website,
} from '@lso/domain';
import type {
  AuditDto,
  BusinessDto,
  CrawlDto,
  FindingDto,
  JobDto,
  OpportunityDto,
  ProviderRunDto,
  RecommendationDto,
  ReportDto,
  ScoreDto,
  WebsiteDto,
} from '@lso/schemas';

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

export function toAuditDto(audit: AuditRun): AuditDto {
  return {
    id: audit.id,
    websiteId: audit.websiteId,
    crawlId: audit.crawlId,
    mode: audit.mode,
    status: audit.status,
    version: audit.version,
    startedAt: audit.startedAt?.toISOString() ?? null,
    completedAt: audit.completedAt?.toISOString() ?? null,
    createdAt: audit.createdAt.toISOString(),
    updatedAt: audit.updatedAt.toISOString(),
  };
}

export function toFindingDto(finding: Finding): FindingDto {
  return {
    id: finding.id,
    auditRunId: finding.auditRunId,
    evidenceId: finding.evidenceId,
    ruleId: finding.ruleId,
    outcome: finding.outcome,
    summary: finding.summary,
    createdAt: finding.createdAt.toISOString(),
    updatedAt: finding.updatedAt.toISOString(),
  };
}

export function toRecommendationDto(recommendation: Recommendation): RecommendationDto {
  return {
    id: recommendation.id,
    findingId: recommendation.findingId,
    priority: recommendation.priority,
    action: recommendation.action,
    createdAt: recommendation.createdAt.toISOString(),
    updatedAt: recommendation.updatedAt.toISOString(),
  };
}

export function toScoreDto(score: AuditScore): ScoreDto {
  return {
    id: score.id,
    auditRunId: score.auditRunId,
    overall: score.overall,
    seo: score.seo,
    performance: score.performance,
    categories: score.categories,
    createdAt: score.createdAt.toISOString(),
    updatedAt: score.updatedAt.toISOString(),
  };
}

export function toReportDto(report: Report): ReportDto {
  return {
    id: report.id,
    auditRunId: report.auditRunId,
    format: report.format,
    path: report.path,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export function toOpportunityDto(row: OpportunityRow): OpportunityDto {
  return {
    businessId: row.businessId,
    name: row.name,
    websiteUrl: row.websiteUrl,
    opportunityScore: row.opportunityScore,
    auditScore: row.auditScore,
    reason: row.reason,
  };
}

export function toProviderRunDto(run: ProviderRun): ProviderRunDto {
  return {
    id: run.id,
    provider: run.provider,
    status: run.status,
    payload: run.payload,
    startedAt: run.startedAt?.toISOString() ?? null,
    completedAt: run.completedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}
