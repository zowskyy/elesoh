import { api, apiBaseUrl } from '../api';

export interface JobDto {
  id: string;
  status: string;
  error: string | null;
}

export interface AnalyzeResponse {
  url: string;
  website: { id: string };
  job: JobDto;
  crawl: { id: string };
}

export interface AuditEnqueueResponse {
  job: JobDto;
  audit: { id: string };
}

export interface ScoreDto {
  overall: number;
  seo: number;
  performance: number | null;
}

export interface FindingDto {
  id: string;
  ruleId: string;
  outcome: string;
  summary: string;
}

export interface RecommendationDto {
  id: string;
  findingId: string;
  priority: string;
  action: string;
}

export interface ReportDto {
  id: string;
  format: string;
}

export interface TopItem {
  ruleId: string;
  outcome: string;
  summary: string;
  action: string;
  priority: string;
}

export interface BatchAnalyzeItem {
  url: string;
  websiteId: string;
  auditId: string | null;
  stage: 'crawl' | 'audit' | 'report' | 'done' | 'failed';
  crawlJobId: string;
  auditJobId: string | null;
  reportJobId: string | null;
  reportId: string | null;
  score: ScoreDto | null;
  topIssues: TopItem[];
  error: string | null;
}

export interface BatchAnalyzeResponse {
  batchId: string;
  items: BatchAnalyzeItem[];
  completedCount: number;
  failedCount: number;
  totalCount: number;
}

export async function waitForJob(
  jobId: string,
  label: string,
  onStatus: (status: string) => void,
): Promise<JobDto> {
  for (let i = 0; i < 80; i += 1) {
    const job = await api<JobDto>(`/jobs/${jobId}`);
    onStatus(`${label}: ${job.status}`);
    if (job.status.toUpperCase() === 'COMPLETED') {
      return job;
    }
    if (job.status.toUpperCase() === 'FAILED') {
      throw new Error(job.error ?? `${label} failed`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(`${label} timed out`);
}

export function pickTopTen(
  findings: FindingDto[],
  recommendations: RecommendationDto[],
): TopItem[] {
  const recByFinding = new Map(recommendations.map((rec) => [rec.findingId, rec]));
  const severity = (outcome: string): number => {
    if (outcome === 'FAIL') return 0;
    if (outcome === 'WARN') return 1;
    if (outcome === 'ERROR') return 2;
    return 3;
  };
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

export async function runSingleAnalyze(
  url: string,
  onStatus: (status: string) => void,
): Promise<{
  score: ScoreDto;
  top: TopItem[];
  reportUrl: string | null;
}> {
  onStatus('Starting analyze…');
  const started = await api<AnalyzeResponse>('/analyze', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });

  await waitForJob(started.job.id, 'Crawl', onStatus);

  onStatus('Enqueueing audit…');
  const auditEnqueue = await api<AuditEnqueueResponse>(`/websites/${started.website.id}/audits`, {
    method: 'POST',
    body: JSON.stringify({ mode: 'seo' }),
  });
  await waitForJob(auditEnqueue.job.id, 'Audit', onStatus);

  const [score, findings, recommendations] = await Promise.all([
    api<ScoreDto>(`/audits/${auditEnqueue.audit.id}/score`),
    api<FindingDto[]>(`/audits/${auditEnqueue.audit.id}/findings`),
    api<RecommendationDto[]>(`/audits/${auditEnqueue.audit.id}/recommendations`),
  ]);

  onStatus('Generating report…');
  const reportJob = await api<{ job: JobDto }>(`/audits/${auditEnqueue.audit.id}/reports`, {
    method: 'POST',
    body: JSON.stringify({ format: 'html' }),
  });
  await waitForJob(reportJob.job.id, 'Report', onStatus);
  const reports = await api<ReportDto[]>(`/audits/${auditEnqueue.audit.id}/reports`);
  const html = reports.find((report) => report.format === 'html') ?? reports[0];
  const reportUrl = html !== undefined ? `${apiBaseUrl}/reports/${html.id}/content` : null;
  onStatus('Done');

  return {
    score,
    top: pickTopTen(findings, recommendations),
    reportUrl,
  };
}

export async function startBatchAnalyze(urls: string[]): Promise<BatchAnalyzeResponse> {
  return api<BatchAnalyzeResponse>('/analyze/batch', {
    method: 'POST',
    body: JSON.stringify({ urls }),
  });
}

export async function pollBatchAnalyze(batchId: string): Promise<BatchAnalyzeResponse> {
  return api<BatchAnalyzeResponse>(`/analyze/batch/${batchId}`);
}

export function reportContentUrl(reportId: string): string {
  return `${apiBaseUrl}/reports/${reportId}/content`;
}
