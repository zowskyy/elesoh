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
        <h2>Free stack — $0/month</h2>
        <p className="muted">
          One Oracle Cloud VM (free forever) + this app. No Render, no home computer.
        </p>
        <p>
          <a href={FREE_PLAN} target="_blank" rel="noreferrer">
            Read the full free stack plan
          </a>
        </p>
        <h3>Quick setup</h3>
        <ol>
          <li>
            <a href={ORACLE_GUIDE} target="_blank" rel="noreferrer">
              Create Oracle Always Free VM
            </a>{' '}
            — open port <strong>3001</strong>
          </li>
          <li>
            SSH once, run:
            <pre className="setup-code">{`export POSTGRES_PASSWORD='your-password'
curl -fsSL https://raw.githubusercontent.com/zowskyy/elesoh/cursor/android-apk-browser-history-5128/scripts/deploy/oracle-cloud-install.sh | bash`}</pre>
          </li>
          <li>
            <Link to="/settings">Settings</Link> → save <code>http://YOUR_VM_IP:3001</code>
          </li>
        </ol>
        <p className="muted">
          Optional later: Supabase Postgres, DuckDNS hostname — still $0. See free stack plan.
        </p>
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
          {error}. Check Oracle firewall (port 3001) and <Link to="/settings">Settings</Link>.
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
