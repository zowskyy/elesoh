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
        <h2>Connect free cloud backend</h2>
        <p className="muted">
          No computer and no paid Render. Deploy once for $0, then paste your API URL here.
        </p>
        <ol>
          <li>
            Follow the free guide:{' '}
            <a
              href="https://github.com/zowskyy/elesoh/blob/cursor/android-apk-browser-history-5128/docs/development/cloud-hosting-free.md"
              target="_blank"
              rel="noreferrer"
            >
              Fly.io + Neon + Upstash ($0)
            </a>
          </li>
          <li>
            Or use{' '}
            <a
              href="https://github.com/zowskyy/elesoh/blob/cursor/android-apk-browser-history-5128/docs/development/cloud-hosting-free.md#option-b--oracle-cloud-always-free-0-forever"
              target="_blank"
              rel="noreferrer"
            >
              Oracle Cloud Always Free
            </a>{' '}
            (full crawls)
          </li>
          <li>
            Open <Link to="/settings">Settings</Link> and save your API URL (e.g.{' '}
            <code>https://lso-optimizer-you.fly.dev</code>)
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
      {error !== null ? <p className="error">{error}</p> : null}
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
