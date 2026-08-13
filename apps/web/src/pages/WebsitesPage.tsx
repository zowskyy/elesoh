import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { api } from '../api';

interface BusinessDto {
  id: string;
  name: string;
}

interface WebsiteDto {
  id: string;
  businessId: string;
  url: string;
}

export function WebsitesPage(): ReactElement {
  const [businesses, setBusinesses] = useState<BusinessDto[]>([]);
  const [businessId, setBusinessId] = useState('');
  const [url, setUrl] = useState('https://example.com');
  const [websites, setWebsites] = useState<WebsiteDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<BusinessDto[]>('/businesses')
      .then((rows) => {
        setBusinesses(rows);
        const first = rows[0];
        if (first !== undefined) {
          setBusinessId(first.id);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'failed to load businesses');
      });
  }, []);

  useEffect(() => {
    if (businessId === '') {
      return;
    }
    api<WebsiteDto[]>(`/websites?businessId=${businessId}`)
      .then(setWebsites)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'failed to load websites');
      });
  }, [businessId]);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    try {
      await api('/websites', {
        method: 'POST',
        body: JSON.stringify({ businessId, url }),
      });
      const rows = await api<WebsiteDto[]>(`/websites?businessId=${businessId}`);
      setWebsites(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'failed to create website');
    }
  }

  return (
    <section>
      <h2>Websites</h2>
      <form onSubmit={(event) => void onSubmit(event)}>
        <select value={businessId} onChange={(event) => setBusinessId(event.target.value)}>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
        <input value={url} onChange={(event) => setUrl(event.target.value)} required />
        <button type="submit" disabled={businessId === ''}>
          Create
        </button>
      </form>
      {error !== null ? <p className="error">{error}</p> : null}
      <ul>
        {websites.map((website) => (
          <li key={website.id}>{website.url}</li>
        ))}
      </ul>
    </section>
  );
}
