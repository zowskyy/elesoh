import { useEffect, useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { api, getApiBaseUrl, isApiConfigured, resetApiBaseUrl, setApiBaseUrl } from '../api';
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
  const configured = isApiConfigured();

  useEffect(() => {
    if (!configured) return;
    api<PlanDto[]>('/plans')
      .then(setPlans)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'failed to load plans');
      });
  }, [configured, apiSaved]);

  return (
    <section>
      <h2>Settings & plans</h2>
      {native ? (
        <form
          className="api-settings setup-card"
          onSubmit={(event) => {
            event.preventDefault();
            setApiBaseUrl(apiUrl);
            setApiSaved(apiUrl);
          }}
        >
          <h3>Oracle Cloud API URL</h3>
          <p className="muted">
            After{' '}
            <a href="https://github.com/zowskyy/elesoh/blob/cursor/android-apk-browser-history-5128/docs/development/oracle-cloud.md" target="_blank" rel="noreferrer">
              Oracle Cloud setup
            </a>
            , paste your VM URL (e.g. <code>http://129.x.x.x:3001</code>).
          </p>
          <div className="history-actions">
            <input
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
              placeholder="http://129.x.x.x:3001"
              style={{ flex: 1, minWidth: '16rem' }}
            />
            <button type="submit">Save API URL</button>
            <button
              type="button"
              onClick={() => {
                resetApiBaseUrl();
                setApiUrl('');
                setApiSaved(null);
              }}
            >
              Clear
            </button>
          </div>
          {apiSaved !== null ? <p className="muted">Saved: {apiSaved}</p> : null}
          {!configured && apiSaved === null ? (
            <p className="error">Save your cloud URL before using Analyze or History.</p>
          ) : null}
        </form>
      ) : (
        <p className="muted">
          Billing, accounts, schedules, and API keys land after the customer audit path.
        </p>
      )}
      {error !== null ? <p className="error">{error}</p> : null}
      {configured ? (
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
      ) : (
        <p>
          <Link to="/">Back to setup guide</Link>
        </p>
      )}
    </section>
  );
}
