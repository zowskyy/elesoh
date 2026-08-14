import { randomUUID } from 'node:crypto';
import type { JobRepository } from '@lso/domain';
import type { AnalyzeService } from './analyze-service.js';
import type { AuditService } from './audit-service.js';
import type { ReportService } from './report-service.js';

const BATCH_KEY = (batchId: string) => `lso:taylor:batch:${batchId}`;
const BATCH_TTL_SECONDS = 60 * 60 * 24;

interface RedisBatchStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttl: number): Promise<unknown>;
}

function isJobFailed(status: string): boolean {
  return status.toUpperCase() === 'FAILED';
}

function isJobCompleted(status: string): boolean {
  return status.toUpperCase() === 'COMPLETED';
}

export type TaylorBatchStage = 'crawl' | 'audit' | 'report' | 'done' | 'failed';

export interface TaylorBatchItem {
  url: string;
  websiteId: string;
  auditId: string | null;
  stage: TaylorBatchStage;
  crawlJobId: string;
  auditJobId: string | null;
  reportJobId: string | null;
  reportId: string | null;
  score: { overall: number; seo: number; performance: number | null } | null;
  topIssues: Array<{
    ruleId: string;
    outcome: string;
    summary: string;
    action: string;
    priority: string;
  }>;
  error: string | null;
}

export interface TaylorBatch {
  id: string;
  createdAt: string;
  items: TaylorBatchItem[];
}

function severity(outcome: string): number {
  if (outcome === 'FAIL') return 0;
  if (outcome === 'WARN') return 1;
  if (outcome === 'ERROR') return 2;
  return 3;
}

export class TaylorBatchService {
  public constructor(
    private readonly redis: RedisBatchStore,
    private readonly jobs: JobRepository,
    private readonly analyze: AnalyzeService,
    private readonly audits: AuditService,
    private readonly reports: ReportService,
  ) {}

  public async startBatch(
    urls: string[],
    options: { allowLocalhost?: boolean; idempotencyKey?: string } = {},
  ): Promise<TaylorBatch> {
    const uniqueUrls = [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
    const batchId = randomUUID();
    const items: TaylorBatchItem[] = [];

    for (const [index, url] of uniqueUrls.entries()) {
      try {
        const started = await this.analyze.startFromUrl(url, {
          allowLocalhost: options.allowLocalhost === true,
          idempotencyKey: options.idempotencyKey
            ? `${options.idempotencyKey}:${index}:${url}`
            : `taylor:${batchId}:${index}`,
        });
        items.push({
          url: started.url,
          websiteId: started.website.id,
          auditId: null,
          stage: 'crawl',
          crawlJobId: started.job.id,
          auditJobId: null,
          reportJobId: null,
          reportId: null,
          score: null,
          topIssues: [],
          error: null,
        });
      } catch (error) {
        items.push({
          url,
          websiteId: randomUUID(),
          auditId: null,
          stage: 'failed',
          crawlJobId: randomUUID(),
          auditJobId: null,
          reportJobId: null,
          reportId: null,
          score: null,
          topIssues: [],
          error: error instanceof Error ? error.message : 'failed to start analyze',
        });
      }
    }

    const batch: TaylorBatch = {
      id: batchId,
      createdAt: new Date().toISOString(),
      items,
    };
    await this.saveBatch(batch);
    return batch;
  }

  public async getBatch(batchId: string): Promise<TaylorBatch | null> {
    const raw = await this.redis.get(BATCH_KEY(batchId));
    if (raw === null) {
      return null;
    }
    const batch = JSON.parse(raw) as TaylorBatch;
    await this.advanceBatch(batch);
    await this.saveBatch(batch);
    return batch;
  }

  private async advanceBatch(batch: TaylorBatch): Promise<void> {
    await Promise.all(batch.items.map((item) => this.advanceItem(item)));
  }

  private async advanceItem(item: TaylorBatchItem): Promise<void> {
    if (item.stage === 'done' || item.stage === 'failed') {
      return;
    }

    try {
      if (item.stage === 'crawl') {
        const crawlJob = await this.jobs.findById(item.crawlJobId);
        if (crawlJob === null) {
          item.stage = 'failed';
          item.error = 'crawl job not found';
          return;
        }
        if (isJobFailed(crawlJob.status)) {
          item.stage = 'failed';
          item.error = crawlJob.error ?? 'crawl failed';
          return;
        }
        if (!isJobCompleted(crawlJob.status)) {
          return;
        }

        const auditResult = await this.audits.enqueueAudit(item.websiteId, 'seo', `taylor-audit:${item.crawlJobId}`);
        item.auditId = auditResult.audit.id;
        item.auditJobId = auditResult.job.id;
        item.stage = 'audit';
      }

      if (item.stage === 'audit') {
        if (item.auditJobId === null || item.auditId === null) {
          item.stage = 'failed';
          item.error = 'audit job missing';
          return;
        }
        const auditJob = await this.jobs.findById(item.auditJobId);
        if (auditJob === null) {
          item.stage = 'failed';
          item.error = 'audit job not found';
          return;
        }
        if (isJobFailed(auditJob.status)) {
          item.stage = 'failed';
          item.error = auditJob.error ?? 'audit failed';
          return;
        }
        if (!isJobCompleted(auditJob.status)) {
          return;
        }

        const [score, findings, recommendations] = await Promise.all([
          this.audits.getScore(item.auditId),
          this.audits.listFindings(item.auditId),
          this.audits.listRecommendations(item.auditId),
        ]);
        item.score = {
          overall: score.overall,
          seo: score.seo,
          performance: score.performance,
        };
        item.topIssues = this.pickTopTen(findings, recommendations);

        const reportResult = await this.reports.enqueueReport(item.auditId, 'html', `taylor-report:${item.auditJobId}`);
        item.reportJobId = reportResult.job.id;
        item.stage = 'report';
      }

      if (item.stage === 'report') {
        if (item.reportJobId === null || item.auditId === null) {
          item.stage = 'failed';
          item.error = 'report job missing';
          return;
        }
        const reportJob = await this.jobs.findById(item.reportJobId);
        if (reportJob === null) {
          item.stage = 'failed';
          item.error = 'report job not found';
          return;
        }
        if (isJobFailed(reportJob.status)) {
          item.stage = 'failed';
          item.error = reportJob.error ?? 'report failed';
          return;
        }
        if (!isJobCompleted(reportJob.status)) {
          return;
        }

        const reports = await this.reports.listReports(item.auditId);
        const html = reports.find((report) => report.format === 'html') ?? reports[0];
        item.reportId = html?.id ?? null;
        item.stage = 'done';
      }
    } catch (error) {
      item.stage = 'failed';
      item.error = error instanceof Error ? error.message : 'batch item failed';
    }
  }

  private pickTopTen(
    findings: Array<{ id: string; ruleId: string; outcome: string; summary: string }>,
    recommendations: Array<{ findingId: string; priority: string; action: string }>,
  ): TaylorBatchItem['topIssues'] {
    const recByFinding = new Map(recommendations.map((rec) => [rec.findingId, rec]));
    return findings
      .filter((finding) => finding.outcome === 'FAIL' || finding.outcome === 'WARN' || finding.outcome === 'ERROR')
      .sort((a, b) => severity(a.outcome) - severity(b.outcome))
      .slice(0, 10)
      .map((finding) => {
        const rec = recByFinding.get(finding.id);
        return {
          ruleId: finding.ruleId,
          outcome: finding.outcome,
          summary: finding.summary,
          action: rec?.action ?? 'Review and fix this issue.',
          priority: rec?.priority ?? 'medium',
        };
      });
  }

  private async saveBatch(batch: TaylorBatch): Promise<void> {
    await this.redis.set(BATCH_KEY(batch.id), JSON.stringify(batch), 'EX', BATCH_TTL_SECONDS);
  }
}
