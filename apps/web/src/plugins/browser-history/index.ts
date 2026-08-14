import { registerPlugin } from '@capacitor/core';

export interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: string | null;
}

export interface BrowserHistoryPlugin {
  getRecent(options: { limit?: number }): Promise<{ entries: HistoryEntry[] }>;
  requestPermission(): Promise<{ granted: boolean }>;
}

export const BrowserHistory = registerPlugin<BrowserHistoryPlugin>('BrowserHistory', {
  web: () => import('./browser-history-web').then((module) => new module.BrowserHistoryWeb()),
});
