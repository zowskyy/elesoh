import { useEffect, useState, type ReactElement } from 'react';
import { api, getApiBaseUrl, isUsingCloudApi, resetApiBaseUrl, setApiBaseUrl } from '../api';
import { DEFAULT_CLOUD_API_URL } from '../lib/cloud';
import { isNativeApp } from '../lib/mobile';

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
  const native = isNativeApp();
  const cloud = isUsingCloudApi();

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
      {native ? (
        <form
          className="api-settings"
          onSubmit={(event) => {
            event.preventDefault();
            setApiBaseUrl(apiUrl);
            setApiSaved(apiUrl);
          }}
        >
          <h3>API server</h3>
          {cloud ? (
            <p className="muted">
              Using cloud API (default). No computer needed after one-time Render deploy.
            </p>
          ) : (
            <p className="muted">Custom API URL (self-hosted or LAN).</p>
          )}
          <div className="history-actions">
            <input
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              placeholder={DEFAULT_CLOUD_API_URL}
              style={{ flex: 1, minWidth: '16rem' }}
            />
            <button type="submit">Save API URL</button>
            <button
              type="button"
              onClick={() => {
                resetApiBaseUrl();
                setApiUrl(DEFAULT_CLOUD_API_URL);
                setApiSaved(DEFAULT_CLOUD_API_URL);
              }}
            >
              Use cloud default
            </button>
          </div>
          {apiSaved !== null ? <p className="muted">Saved: {apiSaved}</p> : null}
        </form>
      ) : null}
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
