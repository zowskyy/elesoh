export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() === true;
}

export interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: string | null;
}

export async function loadBrowserHistory(limit = 100): Promise<HistoryEntry[]> {
  if (isNativeApp()) {
    const { BrowserHistory } = await import('../plugins/browser-history');
    const result = await BrowserHistory.getRecent({ limit });
    return result.entries;
  }

  return [];
}

export async function readClipboardUrls(): Promise<string[]> {
  if (isNativeApp()) {
    const { Clipboard } = await import('@capacitor/clipboard');
    const { value } = await Clipboard.read();
    return parseUrlLines(value);
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.readText !== undefined) {
    try {
      const text = await navigator.clipboard.readText();
      return parseUrlLines(text);
    } catch {
      return [];
    }
  }

  return [];
}

export function parseUrlLines(text: string): string[] {
  const urls = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/https?:\/\/[^\s]+/i);
    const candidate = match?.[0] ?? trimmed;
    if (/^https?:\/\//i.test(candidate)) {
      urls.add(candidate.replace(/[),.;]+$/, ''));
    }
  }
  return [...urls];
}

export function dedupeByHost(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of urls) {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      if (seen.has(host)) continue;
      seen.add(host);
      result.push(raw);
    } catch {
      continue;
    }
  }
  return result;
}
