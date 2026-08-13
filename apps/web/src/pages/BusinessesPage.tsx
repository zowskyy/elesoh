import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { api } from '../api';

interface BusinessDto {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  websiteUrl: string | null;
}

export function BusinessesPage(): ReactElement {
  const [businesses, setBusinesses] = useState<BusinessDto[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refresh(): Promise<void> {
    const rows = await api<BusinessDto[]>('/businesses');
    setBusinesses(rows);
  }

  useEffect(() => {
    refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'failed to load businesses');
    });
  }, []);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    try {
      await api('/businesses', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setName('');
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'failed to create business');
    }
  }

  return (
    <section>
      <h2>Businesses</h2>
      <form onSubmit={(event) => void onSubmit(event)}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Business name"
          required
        />
        <button type="submit">Create</button>
      </form>
      {error !== null ? <p className="error">{error}</p> : null}
      <ul>
        {businesses.map((business) => (
          <li key={business.id}>
            <strong>{business.name}</strong>
            {business.category !== null ? ` · ${business.category}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
