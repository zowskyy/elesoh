import type { DiscoveredBusiness } from '../types.js';

export function discoverImported(rows: DiscoveredBusiness[]): DiscoveredBusiness[] {
  return rows.map((row) => ({
    ...row,
    source: 'imported' as const,
    externalId: row.externalId,
  }));
}
