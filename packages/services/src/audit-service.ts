import { buildRecommendations, runSeoRules } from '@lso/audits';
import type { Env } from '@lso/config';
import type {
  AuditRepository,
  AuditRun,
  AuditScore,
  CrawlRepository,
  Finding,
  FindingRepository,
  Job,
  JobRepository,
  PageRepository,
  Recommendation,
  RecommendationRepository,
  ScoreRepository,
  WebsiteRepository,
} from '@lso/domain';
import { measurePerformance, performanceFindings } from '@lso/performance';
import { computeAuditScore } from '@lso/scoring';
import type { Queue } from 'bullmq';
import { NotFoundError } from './errors.js';
import { JobService } from './job-service.js';

export const AUDIT_QUEUE_NAME = 'audit';
export const SEO_AUDIT_JOB_NAME = 'RUN_SEO_AUDIT';
export const FULL_AUDIT_JOB_NAME = 'RUN_FULL_AUDIT';

export class AuditService {
  public constructor(
    private readonly websites: WebsiteRepository,
    private readonly crawls: CrawlRepository,
    private readonly pages: PageRepository,
    private readonly audits: AuditRepository,
    private readonly findings: FindingRepository,
    private readonly recommendations: RecommendationRepository,
    private readonly scores: ScoreRepository,
    private readonly jobs: JobRepository,
    private readonly jobService: JobService,
    private readonly queue: Queue,
    private readonly env: Env,
  ) {}

  public async enqueueAudit(
    websiteId: string,
    mode: 'seo' | 'full' = 'seo',
    idempotencyKey?: string,
  ): Promise<{ job: Job; audit: AuditRun; created: boolean }> {
    const website = await this.websites.findById(websiteId);
    if (website === null) {
      throw new NotFoundError(`Website not found: ${websiteId}`);
    }

    const key = idempotencyKey ?? `audit:${mode}:${websiteId}`;
    const existingJob = await this.jobs.findByIdempotencyKey(key);
    if (existingJob !== null) {
      const auditId = existingJob.payload['auditId'];
      if (typeof auditId === 'string') {
        const audit = await this.audits.findById(auditId);
        if (audit !== null) {
          return { job: existingJob, audit, created: false };
        }
      }
    }

    const crawl = await this.crawls.findLatestCompleted(websiteId);
    const audit = await this.audits.create({
      websiteId,
      crawlId: crawl?.id ?? null,
      mode,
      version: this.env.AUDIT_RULESET_VERSION,
    });

    const jobType = mode === 'full' ? 'RUN_FULL_AUDIT' : 'RUN_SEO_AUDIT';
    const { job, created } = await this.jobService.createIfAbsent({
      type: jobType,
      idempotencyKey: key,
      payload: {
        websiteId,
        auditId: audit.id,
        mode,
        url: website.url,
        crawlId: crawl?.id ?? null,
      },
    });

    if (created) {
      await this.queue.add(
        jobType,
        {
          jobId: job.id,
          websiteId,
          auditId: audit.id,
          mode,
          url: website.url,
          crawlId: crawl?.id ?? null,
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

    return { job, audit, created };
  }

  public async getAudit(id: string): Promise<AuditRun> {
    const audit = await this.audits.findById(id);
    if (audit === null) {
      throw new NotFoundError(`Audit not found: ${id}`);
    }
    return audit;
  }

  public async getJob(id: string): Promise<Job> {
    const job = await this.jobs.findById(id);
    if (job === null) {
      throw new NotFoundError(`Job not found: ${id}`);
    }
    return job;
  }

  public async listFindings(auditId: string): Promise<Finding[]> {
    await this.getAudit(auditId);
    return this.findings.listByAudit(auditId);
  }

  public async listRecommendations(auditId: string): Promise<Recommendation[]> {
    await this.getAudit(auditId);
    return this.recommendations.listByAudit(auditId);
  }

  public async getScore(auditId: string): Promise<AuditScore> {
    await this.getAudit(auditId);
    const score = await this.scores.findByAudit(auditId);
    if (score === null) {
      throw new NotFoundError(`Score not found for audit: ${auditId}`);
    }
    return score;
  }

  public async executeAuditJob(input: {
    jobId: string;
    auditId: string;
    websiteId: string;
    url: string;
    mode: 'seo' | 'full';
    crawlId: string | null;
  }): Promise<{ findingCount: number; overall: number }> {
    await this.jobs.markRunning(input.jobId);
    await this.audits.markRunning(input.auditId);

    try {
      let crawlId = input.crawlId;
      if (crawlId === null) {
        const latest = await this.crawls.findLatestCompleted(input.websiteId);
        crawlId = latest?.id ?? null;
      }
      if (crawlId === null) {
        throw new Error('No completed crawl available for audit. Run a crawl first.');
      }

      const snapshots = await this.pages.listSnapshotsByCrawl(crawlId);
      if (snapshots.length === 0) {
        throw new Error(`Crawl ${crawlId} has no page evidence to audit.`);
      }

      const seoFindings = runSeoRules({
        websiteUrl: input.url,
        pages: snapshots,
      });

      let perfEvaluations = undefined as ReturnType<typeof performanceFindings> | undefined;
      if (input.mode === 'full') {
        const first = snapshots[0];
        if (first !== undefined) {
          const measured = await measurePerformance(input.url, {
            enabled: this.env.PERFORMANCE_ENABLED,
          });
          perfEvaluations = performanceFindings(first.evidenceId, measured);
        }
      }

      const score = computeAuditScore({
        seoFindings,
        ...(perfEvaluations !== undefined ? { performanceFindings: perfEvaluations } : {}),
      });

      const allEvaluations = [...seoFindings, ...(perfEvaluations ?? [])];
      const persisted = await this.findings.insertMany(
        allEvaluations.map((finding) => ({
          auditRunId: input.auditId,
          evidenceId: finding.evidenceId,
          ruleId: finding.ruleId,
          outcome: finding.outcome,
          summary: finding.summary,
        })),
      );

      const recs = buildRecommendations(allEvaluations);
      const findingKey = new Map(
        persisted.map((finding) => [`${finding.ruleId}:${finding.evidenceId}:${finding.summary}`, finding.id]),
      );
      await this.recommendations.insertMany(
        recs.flatMap((rec) => {
          const findingId = findingKey.get(`${rec.ruleId}:${rec.evidenceId}:${rec.summary}`);
          if (findingId === undefined) {
            return [];
          }
          return [{ findingId, priority: rec.priority, action: rec.action }];
        }),
      );

      await this.scores.upsert({
        auditRunId: input.auditId,
        overall: score.overall,
        seo: score.seo,
        performance: score.performance,
        categories: score.categories,
      });

      await this.audits.markCompleted(input.auditId);
      await this.jobs.markCompleted(input.jobId);
      return { findingCount: persisted.length, overall: score.overall };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'audit failed';
      await this.audits.markFailed(input.auditId);
      await this.jobs.markFailed(input.jobId, message);
      throw error;
    }
  }
}
