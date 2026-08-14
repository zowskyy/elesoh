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

const NO_CARD_GUIDE =
  'https://github.com/zowskyy/elesoh/blob/cursor/stage-a-infrastructure-foundation/docs/development/no-card-hosting.md';

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
        <h2>Cloud API setup</h2>
        <p className="muted">
          For phone-only use, deploy a free backend and paste the URL in Settings. See the no-card
          hosting guide.
        </p>
        <p>
          <a href={NO_CARD_GUIDE} target="_blank" rel="noreferrer">
            Full no-card setup guide
          </a>
        </p>
        <h3>Quick setup</h3>
        <ol>
          <li>
            Copy <strong>DATABASE_URL</strong> (Supabase) and <strong>REDIS_URL</strong> (Upstash)
            from each dashboard
          </li>
          <li>
            Deploy on{' '}
            <a href="https://dashboard.render.com" target="_blank" rel="noreferrer">
              Render
            </a>{' '}
            (free, no card) — Docker service, paste env vars
          </li>
          <li>
            <Link to="/settings">Settings</Link> → save your Render URL (e.g.{' '}
            <code>https://lso-optimizer.onrender.com</code>)
          </li>
        </ol>
        <p className="muted">Or use Koyeb free — same env vars, no card.</p>
        <p>
          <Link to="/settings">Go to Settings →</Link>
        </p>
      </section>
    );
  }

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
      {error !== null ? (
        <p className="error">
          {error}. {cloud ? 'Free hosts sleep when idle — wait 30s and retry. ' : null}
          Check <Link to="/settings">Settings</Link>.
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
