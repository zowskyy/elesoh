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

const FREE_PLAN =
  'https://github.com/zowskyy/elesoh/blob/cursor/android-apk-browser-history-5128/docs/development/free-stack-plan.md';

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
        <h2>Free stack — $0/month</h2>
        <p className="muted">
          Supabase + Upstash + Fly.io. No Oracle, no Render, no home computer.
        </p>
        <p>
          <a href={FREE_PLAN} target="_blank" rel="noreferrer">
            Full setup guide
          </a>
        </p>
        <h3>Quick setup</h3>
        <ol>
          <li>
            Create free accounts:{' '}
            <a href="https://supabase.com" target="_blank" rel="noreferrer">
              Supabase
            </a>
            ,{' '}
            <a href="https://upstash.com" target="_blank" rel="noreferrer">
              Upstash
            </a>
            ,{' '}
            <a href="https://fly.io" target="_blank" rel="noreferrer">
              Fly.io
            </a>
          </li>
          <li>
            Deploy once (terminal or Codespaces):
            <pre className="setup-code">{`export FLY_APP_NAME=lso-optimizer-you
export DATABASE_URL='postgresql://...supabase...'
export REDIS_URL='rediss://...upstash...'
bash scripts/deploy/fly-free-deploy.sh`}</pre>
          </li>
          <li>
            <Link to="/settings">Settings</Link> → save{' '}
            <code>https://lso-optimizer-you.fly.dev</code>
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
          <strong>Free cloud</strong> — {getApiBaseUrl()}. $0/month, no computer required.
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
          {error}. If Fly was sleeping, wait 30s and retry. Check <Link to="/settings">Settings</Link>.
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
