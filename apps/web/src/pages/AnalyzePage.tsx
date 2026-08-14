import { useState, type FormEvent, type ReactElement } from 'react';
import { api, apiBaseUrl } from '../api';

interface JobDto {
  id: string;
  status: string;
  error: string | null;
}

interface AnalyzeResponse {
  url: string;
  website: { id: string };
  job: JobDto;
  crawl: { id: string };
}

interface AuditEnqueueResponse {
  job: JobDto;
  audit: { id: string };
}

interface ScoreDto {
  overall: number;
  seo: number;
  performance: number | null;
}

interface FindingDto {
  id: string;
  ruleId: string;
  outcome: string;
  summary: string;
}

interface RecommendationDto {
  id: string;
  findingId: string;
  priority: string;
  action: string;
}

interface ReportDto {
  id: string;
  format: string;
}

interface TopItem {
  ruleId: string;
  outcome: string;
  summary: string;
  action: string;
  priority: string;
}

async function waitForJob(jobId: string, label: string, onStatus: (s: string) => void): Promise<JobDto> {
  for (let i = 0; i < 80; i += 1) {
    const job = await api<JobDto>(`/jobs/${jobId}`);
    onStatus(`${label}: ${job.status}`);
    if (job.status === 'completed') {
      return job;
    }
    if (job.status === 'failed') {
      throw new Error(job.error ?? `${label} failed`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(`${label} timed out`);
}

function pickTopTen(
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

export function AnalyzePage(): ReactElement {
  const [url, setUrl] = useState('http://127.0.0.1:4173/');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<ScoreDto | null>(null);
  const [top, setTop] = useState<TopItem[]>([]);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setScore(null);
    setTop([]);
    setReportUrl(null);
    setBusy(true);
    try {
      setStatus('Starting analyze…');
      const started = await api<AnalyzeResponse>('/analyze', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });

      await waitForJob(started.job.id, 'Crawl', setStatus);

      setStatus('Enqueueing audit…');
      const auditEnqueue = await api<AuditEnqueueResponse>(`/websites/${started.website.id}/audits`, {
        method: 'POST',
        body: JSON.stringify({ mode: 'seo' }),
      });
      await waitForJob(auditEnqueue.job.id, 'Audit', setStatus);

      const [scoreDto, findings, recommendations] = await Promise.all([
        api<ScoreDto>(`/audits/${auditEnqueue.audit.id}/score`),
        api<FindingDto[]>(`/audits/${auditEnqueue.audit.id}/findings`),
        api<RecommendationDto[]>(`/audits/${auditEnqueue.audit.id}/recommendations`),
      ]);
      setScore(scoreDto);
      setTop(pickTopTen(findings, recommendations));

      setStatus('Generating report…');
      const reportJob = await api<{ job: JobDto }>(`/audits/${auditEnqueue.audit.id}/reports`, {
        method: 'POST',
        body: JSON.stringify({ format: 'html' }),
      });
      await waitForJob(reportJob.job.id, 'Report', setStatus);
      const reports = await api<ReportDto[]>(`/audits/${auditEnqueue.audit.id}/reports`);
      const html = reports.find((report) => report.format === 'html') ?? reports[0];
      if (html !== undefined) {
        setReportUrl(`${apiBaseUrl}/reports/${html.id}/content`);
      }
      setStatus('Done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'analyze failed');
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="analyze">
      <h2>Analyze a website</h2>
      <p className="muted">Enter a URL → crawl → SEO score → top 10 issues → HTML report.</p>
      <form onSubmit={(event) => void onSubmit(event)}>
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          style={{ flex: 1, minWidth: '16rem' }}
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          {busy ? 'Running…' : 'Analyze'}
        </button>
      </form>
      {status !== null ? <p>{status}</p> : null}
      {error !== null ? <p className="error">{error}</p> : null}

      {score !== null ? (
        <div className="score-panel">
          <h3>Score</h3>
          <p className="score-overall">{score.overall}</p>
          <p className="muted">
            SEO {score.seo}
            {score.performance !== null ? ` · Performance ${score.performance}` : ''}
          </p>
        </div>
      ) : null}

      {top.length > 0 ? (
        <>
          <h3>Top {top.length} issues</h3>
          <ol className="top-list">
            {top.map((item) => (
              <li key={`${item.ruleId}-${item.summary}`}>
                <strong>
                  [{item.outcome}] {item.ruleId}
                </strong>
                <div>{item.summary}</div>
                <div className="muted">
                  {item.priority}: {item.action}
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {reportUrl !== null ? (
        <p>
          <a href={reportUrl} target="_blank" rel="noreferrer">
            Open HTML report
          </a>
        </p>
      ) : null}
    </section>
  );
}
