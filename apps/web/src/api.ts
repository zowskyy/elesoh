import { DEFAULT_CLOUD_API_URL, isCloudApiUrl } from './lib/cloud';
import { isNativeApp } from './lib/mobile';

const STORAGE_KEY = 'lso_api_url';
const buildTimeApiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export function getDefaultApiBaseUrl(): string {
  if (isNativeApp()) {
    return DEFAULT_CLOUD_API_URL;
  }
  return buildTimeApiUrl;
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().trim().length > 0;
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null && stored.trim() !== '') {
      return stored.replace(/\/$/, '');
    }
  }
  return getDefaultApiBaseUrl();
}

export function setApiBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ''));
}

export function resetApiBaseUrl(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function isUsingCloudApi(): boolean {
  return isCloudApiUrl(getApiBaseUrl());
}

export const apiBaseUrl = getDefaultApiBaseUrl();

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  if (base.length === 0) {
    throw new Error('API URL not configured. Open Settings and enter your cloud URL.');
  }
  const response = await fetch(`${base}${path}`, {
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
