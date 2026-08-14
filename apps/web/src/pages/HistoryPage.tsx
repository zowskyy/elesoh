import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import {
  pollBatchAnalyze,
  reportContentUrl,
  startBatchAnalyze,
  type BatchAnalyzeItem,
  type BatchAnalyzeResponse,
} from '../lib/analyze';
import {
  dedupeByHost,
  isNativeApp,
  loadBrowserHistory,
  parseUrlLines,
  readClipboardUrls,
} from '../lib/mobile';

function stageLabel(stage: BatchAnalyzeItem['stage']): string {
  switch (stage) {
    case 'crawl':
      return 'Crawling';
    case 'audit':
      return 'Auditing';
    case 'report':
      return 'Reporting';
    case 'done':
      return 'Done';
    case 'failed':
      return 'Failed';
    default:
      return stage;
  }
}

export function HistoryPage(): ReactElement {
  const [manualUrls, setManualUrls] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [history, setHistory] = useState<Array<{ url: string; title: string }>>([]);
  const [batch, setBatch] = useState<BatchAnalyzeResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const native = isNativeApp();

  useEffect(() => {
    if (!native) return;
    void (async () => {
      try {
        const { BrowserHistory } = await import('../plugins/browser-history');
        const permission = await BrowserHistory.requestPermission();
        if (!permission.granted) {
          setPermissionDenied(true);
          return;
        }
        const entries = await loadBrowserHistory(150);
        setHistory(entries.map((entry) => ({ url: entry.url, title: entry.title || entry.url })));
        setSelected(dedupeByHost(entries.map((entry) => entry.url)).slice(0, 10));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not read browser history');
      }
    })();
  }, [native]);

  useEffect(() => {
    if (batch === null || batch.completedCount + batch.failedCount >= batch.totalCount) {
      return;
    }
    const timer = window.setInterval(() => {
      void pollBatchAnalyze(batch.batchId)
        .then((next) => {
          setBatch(next);
          setStatus(`Taylor workers: ${next.completedCount}/${next.totalCount} complete`);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'batch poll failed');
        });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [batch]);

  function toggleUrl(url: string): void {
    setSelected((current) =>
      current.includes(url) ? current.filter((item) => item !== url) : [...current, url],
    );
  }

  async function onImportClipboard(): Promise<void> {
    const urls = await readClipboardUrls();
    if (urls.length === 0) {
      setError('No URLs found on clipboard. Copy one URL per line or paste a list of links.');
      return;
    }
    setError(null);
    setSelected(dedupeByHost([...selected, ...urls]));
    setManualUrls(urls.join('\n'));
  }

  async function onAnalyzeSelected(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setBatch(null);
    const fromManual = parseUrlLines(manualUrls);
    const urls = dedupeByHost([...selected, ...fromManual]).slice(0, 25);
    if (urls.length === 0) {
      setError('Select at least one URL from history or paste URLs to analyze.');
      return;
    }
    setBusy(true);
    try {
      setStatus(`Taylor workers starting ${urls.length} site(s)…`);
      const started = await startBatchAnalyze(urls);
      setBatch(started);
      setStatus(`Taylor workers: ${started.completedCount}/${started.totalCount} complete`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'batch analyze failed');
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="history-page">
      <h2>Browser history optimizer</h2>
      <p className="muted">
        {native
          ? 'Import recent browser history URLs and run them through the Taylor worker batch pipeline (crawl → audit → report).'
          : 'Install the Android APK to read browser history on your phone. On web, paste URLs or use clipboard import.'}
      </p>

      {permissionDenied ? (
        <p className="error">
          Browser history permission was denied. Paste URLs below or grant history access in Android settings.
        </p>
      ) : null}

      {history.length > 0 ? (
        <>
          <h3>Recent history ({history.length})</h3>
          <ul className="history-list">
            {history.map((entry) => (
              <li key={entry.url}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(entry.url)}
                    onChange={() => toggleUrl(entry.url)}
                    disabled={busy}
                  />
                  <span className="history-title">{entry.title}</span>
                  <span className="muted history-url">{entry.url}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <form onSubmit={(event) => void onAnalyzeSelected(event)} className="history-form">
        <textarea
          value={manualUrls}
          onChange={(event) => setManualUrls(event.target.value)}
          placeholder="Paste URLs (one per line)"
          rows={5}
          disabled={busy}
        />
        <div className="history-actions">
          <button type="button" onClick={() => void onImportClipboard()} disabled={busy}>
            Import from clipboard
          </button>
          <button type="submit" disabled={busy}>
            {busy ? 'Starting…' : `Analyze ${selected.length || 'selected'} sites`}
          </button>
        </div>
      </form>

      {status !== null ? <p>{status}</p> : null}
      {error !== null ? <p className="error">{error}</p> : null}

      {batch !== null ? (
        <div className="batch-results">
          <h3>
            Batch {batch.batchId.slice(0, 8)} — {batch.completedCount}/{batch.totalCount} done
            {batch.failedCount > 0 ? ` (${batch.failedCount} failed)` : ''}
          </h3>
          <ul className="batch-list">
            {batch.items.map((item) => (
              <li key={`${item.url}-${item.crawlJobId}`} className={`batch-item batch-${item.stage}`}>
                <div className="batch-url">{item.url}</div>
                <div className="muted">{stageLabel(item.stage)}</div>
                {item.score !== null ? (
                  <div>
                    Score <strong>{item.score.overall}</strong> (SEO {item.score.seo})
                  </div>
                ) : null}
                {item.error !== null ? <div className="error">{item.error}</div> : null}
                {item.topIssues.length > 0 ? (
                  <details>
                    <summary>{item.topIssues.length} top issues</summary>
                    <ol>
                      {item.topIssues.map((issue) => (
                        <li key={`${issue.ruleId}-${issue.summary}`}>
                          [{issue.outcome}] {issue.ruleId}: {issue.summary}
                        </li>
                      ))}
                    </ol>
                  </details>
                ) : null}
                {item.reportId !== null ? (
                  <a href={reportContentUrl(item.reportId)} target="_blank" rel="noreferrer">
                    Open report
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
