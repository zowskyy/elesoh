const STORAGE_KEY = 'lso_api_url';
const buildTimeApiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null && stored.trim() !== '') {
      return stored.replace(/\/$/, '');
    }
  }
  return buildTimeApiUrl;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ''));
}

export const apiBaseUrl = buildTimeApiUrl;

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
