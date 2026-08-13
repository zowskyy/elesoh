import { dedupeCandidates } from './normalize.js';
import { discoverImported } from './providers/imported.js';
import { discoverOsm } from './providers/osm.js';
import type { DiscoverQuery, DiscoveredBusiness } from './types.js';

export async function discover(query: DiscoverQuery): Promise<DiscoveredBusiness[]> {
  let raw: DiscoveredBusiness[] = [];
  if (query.provider === 'imported') {
    raw = discoverImported(query.imported ?? []);
  } else if (query.provider === 'osm') {
    if (query.osm === undefined) {
      throw new Error('OSM query requires osm.city');
    }
    raw = await discoverOsm(query.osm);
  } else {
    throw new Error(`Unsupported discovery provider: ${String(query.provider)}`);
  }
  return dedupeCandidates(raw);
}
