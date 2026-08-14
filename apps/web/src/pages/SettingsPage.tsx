import { useEffect, useState, type ReactElement } from 'react';
import { getApiBaseUrl, setApiBaseUrl, api } from '../api';

interface PlanDto {
  id: string;
  name: string;
  auditsPerMonth: number;
  discoveryEnabled: boolean;
  whiteLabel: boolean;
  apiKeys: boolean;
  priceLabel: string;
}

export function SettingsPage(): ReactElement {
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState(() => getApiBaseUrl());
  const [apiSaved, setApiSaved] = useState<string | null>(null);

  useEffect(() => {
    api<PlanDto[]>('/plans')
      .then(setPlans)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'failed to load plans');
      });
  }, []);

  return (
    <section>
      <h2>Settings & plans</h2>
      <p className="muted">
        Billing, accounts, schedules, and API keys land after the customer audit path. Plans below
        are the commercial catalog (not enforced yet).
      </p>
      <form
        className="api-settings"
        onSubmit={(event) => {
          event.preventDefault();
          setApiBaseUrl(apiUrl);
          setApiSaved(apiUrl);
        }}
      >
        <h3>API server (mobile)</h3>
        <p className="muted">Use your computer&apos;s LAN IP, e.g. http://192.168.1.50:3001</p>
        <div className="history-actions">
          <input
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="http://192.168.1.50:3001"
            style={{ flex: 1, minWidth: '16rem' }}
          />
          <button type="submit">Save API URL</button>
        </div>
        {apiSaved !== null ? <p className="muted">Saved: {apiSaved}</p> : null}
      </form>
      {error !== null ? <p className="error">{error}</p> : null}
      <div className="plan-grid">
        {plans.map((plan) => (
          <article key={plan.id} className="plan-card">
            <h3>{plan.name}</h3>
            <p className="score-overall">{plan.priceLabel}</p>
            <ul>
              <li>{plan.auditsPerMonth} audits / month</li>
              <li>Discovery: {plan.discoveryEnabled ? 'yes' : 'no'}</li>
              <li>API keys: {plan.apiKeys ? 'yes' : 'no'}</li>
              <li>White-label: {plan.whiteLabel ? 'yes' : 'no'}</li>
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
