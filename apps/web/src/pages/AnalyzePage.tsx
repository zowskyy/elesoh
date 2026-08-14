import { useState, type FormEvent, type ReactElement } from 'react';
import { runSingleAnalyze, type ScoreDto, type TopItem } from '../lib/analyze';

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
      const result = await runSingleAnalyze(url, setStatus);
      setScore(result.score);
      setTop(result.top);
      setReportUrl(result.reportUrl);
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
