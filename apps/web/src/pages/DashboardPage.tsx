import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { api, getApiBaseUrl, isUsingCloudApi } from '../api';
import { DEFAULT_CLOUD_API_URL } from '../lib/cloud';
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
  const cloud = isUsingCloudApi();

  useEffect(() => {
    api<HealthResponse>('/health')
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'health check failed');
      });
  }, []);

  return (
    <section>
      <h2>Dashboard</h2>
      {native ? (
        <p className="cloud-banner">
          {cloud ? (
            <>
              <strong>Cloud mode</strong> — connected to {getApiBaseUrl()}. No computer required.
            </>
          ) : (
            <>
              <strong>Custom API</strong> — {getApiBaseUrl()}
            </>
          )}
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
      {cloud && error !== null ? (
        <p className="error">
          Cloud API not reachable yet. Deploy once at{' '}
          <a href="https://dashboard.render.com/blueprint/new" target="_blank" rel="noreferrer">
            Render Blueprint
          </a>{' '}
          (see docs/development/cloud-hosting.md). Expected URL: {DEFAULT_CLOUD_API_URL}
        </p>
      ) : null}
      {error !== null && !cloud ? <p className="error">{error}</p> : null}
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
