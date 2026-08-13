import { useEffect, useState, type ReactElement } from 'react';
import { api } from '../api';

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
      <p>Stage A infrastructure foundation.</p>
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
