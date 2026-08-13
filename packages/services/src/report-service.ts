import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { explainAudit } from '@lso/ai';
import type { Env } from '@lso/config';
import type {
  AuditRepository,
  BusinessRepository,
  FindingRepository,
  Job,
  JobRepository,
  RecommendationRepository,
  Report,
  ReportRepository,
  ScoreRepository,
  WebsiteRepository,
} from '@lso/domain';
import { renderHtmlReport, renderPdfReport, type ReportModel } from '@lso/reports';
import type { Queue } from 'bullmq';
import { NotFoundError } from './errors.js';
import { JobService } from './job-service.js';

export const REPORT_QUEUE_NAME = 'report';
export const AI_REPORT_JOB_NAME = 'GENERATE_AI_REPORT';
export const PDF_REPORT_JOB_NAME = 'GENERATE_PDF';

function workspaceRoot(start = process.cwd()): string {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return start;
    }
    dir = parent;
  }
}

function resolveReportDirectory(configured: string): string {
  if (isAbsolute(configured)) {
    return configured;
  }
  return resolve(workspaceRoot(), configured);
}

export class ReportService {
  public constructor(
    private readonly audits: AuditRepository,
    private readonly websites: WebsiteRepository,
    private readonly businesses: BusinessRepository,
    private readonly findings: FindingRepository,
    private readonly recommendations: RecommendationRepository,
    private readonly scores: ScoreRepository,
    private readonly reports: ReportRepository,
    private readonly jobs: JobRepository,
    private readonly jobService: JobService,
    private readonly queue: Queue,
    private readonly env: Env,
  ) {}

  public async enqueueReport(
    auditId: string,
    format: 'html' | 'pdf' = 'html',
    idempotencyKey?: string,
  ): Promise<{ job: Job; created: boolean }> {
    const audit = await this.audits.findById(auditId);
    if (audit === null) {
      throw new NotFoundError(`Audit not found: ${auditId}`);
    }
    if (audit.status !== 'completed') {
      throw new Error(`Audit ${auditId} is not completed`);
    }

    const key = idempotencyKey ?? `report:${format}:${auditId}`;
    const existing = await this.jobs.findByIdempotencyKey(key);
    if (existing !== null) {
      return { job: existing, created: false };
    }

    const jobType = format === 'pdf' ? 'GENERATE_PDF' : 'GENERATE_AI_REPORT';
    const { job, created } = await this.jobService.createIfAbsent({
      type: jobType,
      idempotencyKey: key,
      payload: { auditId, format },
    });

    if (created) {
      await this.queue.add(
        jobType,
        { jobId: job.id, auditId, format },
        {
          jobId: job.id,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    }

    return { job, created };
  }

  public async getReport(id: string): Promise<Report> {
    const report = await this.reports.findById(id);
    if (report === null) {
      throw new NotFoundError(`Report not found: ${id}`);
    }
    return report;
  }

  public async listReports(auditId: string): Promise<Report[]> {
    await this.requireAudit(auditId);
    return this.reports.listByAudit(auditId);
  }

  public async getJob(id: string): Promise<Job> {
    const job = await this.jobs.findById(id);
    if (job === null) {
      throw new NotFoundError(`Job not found: ${id}`);
    }
    return job;
  }

  public async executeReportJob(input: {
    jobId: string;
    auditId: string;
    format: 'html' | 'pdf';
  }): Promise<{ reportIds: string[] }> {
    await this.jobs.markRunning(input.jobId);
    try {
      const model = await this.buildReportModel(input.auditId);
      const reportDir = resolveReportDirectory(this.env.REPORT_DIRECTORY);
      await mkdir(reportDir, { recursive: true });
      const reportIds: string[] = [];

      if (input.format === 'html' || input.format === 'pdf') {
        const htmlPath = join(reportDir, `${input.auditId}.html`);
        await writeFile(htmlPath, renderHtmlReport(model), 'utf8');
        const htmlReport = await this.reports.create({
          auditRunId: input.auditId,
          format: 'html',
          path: htmlPath,
        });
        reportIds.push(htmlReport.id);
      }

      if (input.format === 'pdf') {
        const pdfPath = join(reportDir, `${input.auditId}.pdf`);
        await writeFile(pdfPath, renderPdfReport(model));
        const pdfReport = await this.reports.create({
          auditRunId: input.auditId,
          format: 'pdf',
          path: pdfPath,
        });
        reportIds.push(pdfReport.id);
      }

      const narrativePath = join(reportDir, `${input.auditId}.narrative.json`);
      await writeFile(
        narrativePath,
        JSON.stringify(
          {
            source: model.narrativeSource,
            narrative: model.narrative,
            scores: model.scores,
          },
          null,
          2,
        ),
        'utf8',
      );

      await this.jobs.markCompleted(input.jobId);
      return { reportIds };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'report failed';
      await this.jobs.markFailed(input.jobId, message);
      throw error;
    }
  }

  private async requireAudit(auditId: string) {
    const audit = await this.audits.findById(auditId);
    if (audit === null) {
      throw new NotFoundError(`Audit not found: ${auditId}`);
    }
    return audit;
  }

  private async buildReportModel(auditId: string): Promise<ReportModel> {
    const audit = await this.requireAudit(auditId);
    const website = await this.websites.findById(audit.websiteId);
    if (website === null) {
      throw new NotFoundError(`Website not found: ${audit.websiteId}`);
    }
    const business = await this.businesses.findById(website.businessId);
    const score = await this.scores.findByAudit(auditId);
    if (score === null) {
      throw new Error(`Score missing for audit ${auditId}`);
    }
    const findings = await this.findings.listByAudit(auditId);
    const recommendations = await this.recommendations.listByAudit(auditId);
    const findingById = new Map(findings.map((finding) => [finding.id, finding]));

    const explained = await explainAudit(
      {
        websiteUrl: website.url,
        ...(business?.name !== undefined ? { businessName: business.name } : {}),
        overallScore: score.overall,
        seoScore: score.seo,
        performanceScore: score.performance,
        findings: findings.map((finding) => ({
          ruleId: finding.ruleId,
          outcome: finding.outcome,
          summary: finding.summary,
        })),
        recommendations: recommendations.map((rec) => {
          const finding = findingById.get(rec.findingId);
          return {
            ...(finding !== undefined ? { ruleId: finding.ruleId } : {}),
            priority: rec.priority,
            action: rec.action,
          };
        }),
      },
      {
        ollamaUrl: this.env.OLLAMA_URL,
        model: this.env.OLLAMA_MODEL,
        enabled: this.env.AI_ENABLED,
      },
    );

    return {
      auditId,
      websiteUrl: website.url,
      ...(business?.name !== undefined ? { businessName: business.name } : {}),
      generatedAt: new Date().toISOString(),
      scores: {
        overall: score.overall,
        seo: score.seo,
        performance: score.performance,
      },
      narrative: explained.narrative,
      narrativeSource: explained.source,
      findings: findings.map((finding) => ({
        ruleId: finding.ruleId,
        outcome: finding.outcome,
        summary: finding.summary,
      })),
      recommendations: recommendations.map((rec) => ({
        priority: rec.priority,
        action: rec.action,
      })),
    };
  }
}
