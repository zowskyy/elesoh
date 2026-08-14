import { useEffect, useState, type ReactElement } from 'react';
import { api } from '../api';

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
