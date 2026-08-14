import type { BrowserHistoryPlugin, HistoryEntry } from './index';

export class BrowserHistoryWeb implements BrowserHistoryPlugin {
  public async getRecent(): Promise<{ entries: HistoryEntry[] }> {
    return { entries: [] };
  }

  public async requestPermission(): Promise<{ granted: boolean }> {
    return { granted: false };
  }
}
