import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { api } from '../api';

interface OpportunityDto {
  businessId: string;
  name: string;
  websiteUrl: string | null;
  opportunityScore: number;
  auditScore: number | null;
  reason: string;
}

interface EnqueueResponse {
  job: { id: string; status: string };
  providerRunId: string;
  created: boolean;
}

interface ProviderRunDto {
  id: string;
  status: string;
  payload: Record<string, unknown> | null;
}

export function DiscoveryPage(): ReactElement {
  const [provider, setProvider] = useState<'imported' | 'osm'>('imported');
  const [importJson, setImportJson] = useState(
    '[{"name":"Sample Bakery","websiteUrl":null,"city":"Austin","category":"bakery"}]',
  );
  const [city, setCity] = useState('Austin');
  const [category, setCategory] = useState('cafe');
  const [opportunities, setOpportunities] = useState<OpportunityDto[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshOpportunities(): Promise<void> {
    const rows = await api<OpportunityDto[]>('/opportunities');
    setOpportunities(rows);
  }

  useEffect(() => {
    refreshOpportunities().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'failed to load opportunities');
    });
  }, []);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setStatus('Enqueueing discovery…');
    try {
      const body =
        provider === 'imported'
          ? {
              provider: 'imported',
              businesses: JSON.parse(importJson) as unknown[],
            }
          : { provider: 'osm', city, category, limit: 15 };

      const enqueued = await api<EnqueueResponse>('/discoveries', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setStatus(`Job ${enqueued.job.id} · run ${enqueued.providerRunId}`);

      for (let i = 0; i < 40; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const run = await api<ProviderRunDto>(`/discoveries/${enqueued.providerRunId}`);
        if (run.status === 'completed' || run.status === 'failed') {
          setStatus(`${run.status}: ${JSON.stringify(run.payload)}`);
          break;
        }
      }
      await refreshOpportunities();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'discovery failed');
      setStatus(null);
    }
  }

  return (
    <section>
      <h2>Discovery</h2>
      <p>Import businesses or pull OSM candidates, then rank opportunity.</p>
      <form onSubmit={(event) => void onSubmit(event)}>
        <select
          value={provider}
          onChange={(event) => setProvider(event.target.value as 'imported' | 'osm')}
        >
          <option value="imported">Imported</option>
          <option value="osm">OpenStreetMap</option>
        </select>
        {provider === 'imported' ? (
          <textarea
            value={importJson}
            onChange={(event) => setImportJson(event.target.value)}
            rows={6}
            style={{ width: '100%', marginTop: '0.5rem' }}
          />
        ) : (
          <>
            <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" />
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Category"
            />
          </>
        )}
        <button type="submit">Run discovery</button>
      </form>
      {status !== null ? <p>{status}</p> : null}
      {error !== null ? <p className="error">{error}</p> : null}

      <h3>Opportunities</h3>
      <ul>
        {opportunities.map((row) => (
          <li key={row.businessId}>
            <strong>{row.name}</strong> · opportunity {row.opportunityScore}
            {row.websiteUrl !== null ? ` · ${row.websiteUrl}` : ' · no website'}
            <div className="muted">{row.reason}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
