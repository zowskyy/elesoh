import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { api, getApiBaseUrl, isApiConfigured, isUsingCloudApi } from '../api';
import { isNativeApp } from '../lib/mobile';

interface HealthResponse {
  status: string;
  dependencies: {
    postgres: { status: string };
    redis: { status: string };
  };
}

const ORACLE_GUIDE =
  'https://github.com/zowskyy/elesoh/blob/cursor/android-apk-browser-history-5128/docs/development/oracle-cloud.md';

export function DashboardPage(): ReactElement {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const native = isNativeApp();
  const configured = isApiConfigured();
  const cloud = isUsingCloudApi();

  useEffect(() => {
    if (!configured) return;
    api<HealthResponse>('/health')
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'health check failed');
      });
  }, [configured]);

  if (native && !configured) {
    return (
      <section className="setup-card">
        <h2>Oracle Cloud setup (Option B — $0)</h2>
        <p className="muted">
          Full Playwright crawls on Oracle&apos;s Always Free VM. One SSH session to install, then your phone
          works forever with no home computer.
        </p>
        <ol>
          <li>
            <a href={ORACLE_GUIDE} target="_blank" rel="noreferrer">
              Open the Oracle Cloud guide
            </a>{' '}
            — create a free Ampere VM and open port <strong>3001</strong>
          </li>
          <li>
            SSH once and run:
            <pre className="setup-code">{`export POSTGRES_PASSWORD='your-password'
curl -fsSL https://raw.githubusercontent.com/zowskyy/elesoh/cursor/android-apk-browser-history-5128/scripts/deploy/oracle-cloud-install.sh | bash`}</pre>
          </li>
          <li>
            Copy the printed URL (e.g. <code>http://129.x.x.x:3001</code>)
          </li>
          <li>
            <Link to="/settings">Settings</Link> → paste URL → Save
          </li>
        </ol>
        <p>
          <Link to="/settings">Go to Settings →</Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2>Dashboard</h2>
      {native && cloud ? (
        <p className="cloud-banner">
          <strong>Cloud mode</strong> — {getApiBaseUrl()}. No computer required.
        </p>
      ) : null}
      <p>
        Customer path: <Link to="/analyze">Analyze a website</Link> (URL → score → top 10 → report).
        {native ? (
          <>
            {' '}
            Or use <Link to="/history">History</Link> for batch browser URLs.
          </>
        ) : null}
      </p>
      {error !== null ? (
        <p className="error">
          {error}. Check Oracle security list (port 3001) and your API URL in{' '}
          <Link to="/settings">Settings</Link>.
        </p>
      ) : null}
      {health !== null ? (
        <dl>
          <dt>API</dt>
          <dd>{health.status}</dd>
          <dt>PostgreSQL</dt>
          <dd>{health.dependencies.postgres.status}</dd>
          <dt>Redis</dt>
          <dd>{health.dependencies.redis.status}</dd>
        </dl>
      ) : null}
    </section>
  );
}
