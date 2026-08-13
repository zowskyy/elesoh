import type { DiscoveredBusiness } from '../types.js';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function categoryToOsmTag(category: string | undefined): string {
  const value = (category ?? 'shop').toLowerCase();
  if (value.includes('restaurant') || value.includes('cafe') || value.includes('food')) {
    return 'amenity=restaurant';
  }
  if (value.includes('dentist') || value.includes('doctor') || value.includes('clinic')) {
    return 'amenity=clinic';
  }
  if (value.includes('gym') || value.includes('fitness')) {
    return 'leisure=fitness_centre';
  }
  return 'shop';
}

export async function discoverOsm(input: {
  city: string;
  category?: string;
  limit?: number;
}): Promise<DiscoveredBusiness[]> {
  const city = input.city.trim();
  if (city === '') {
    throw new Error('OSM discovery requires a city');
  }

  const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
  nominatimUrl.searchParams.set('q', city);
  nominatimUrl.searchParams.set('format', 'json');
  nominatimUrl.searchParams.set('limit', '1');

  const geoResponse = await fetch(nominatimUrl, {
    headers: {
      'user-agent': 'LocalSiteOptimizer/0.1 (local discovery)',
      accept: 'application/json',
    },
  });
  if (!geoResponse.ok) {
    throw new Error(`Nominatim HTTP ${geoResponse.status}`);
  }
  const geo = (await geoResponse.json()) as NominatimResult[];
  const first = geo[0];
  if (first === undefined) {
    return [];
  }

  const lat = Number.parseFloat(first.lat);
  const lon = Number.parseFloat(first.lon);
  const radius = 4000;
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 50);
  const tag = categoryToOsmTag(input.category);
  const [key, value] = tag.includes('=') ? tag.split('=') : ['shop', tag];

  const query = `
    [out:json][timeout:25];
    (
      node["${key}"="${value}"](around:${radius},${lat},${lon});
      way["${key}"="${value}"](around:${radius},${lat},${lon});
    );
    out center ${limit};
  `;

  const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'LocalSiteOptimizer/0.1 (local discovery)',
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!overpassResponse.ok) {
    throw new Error(`Overpass HTTP ${overpassResponse.status}`);
  }
  const payload = (await overpassResponse.json()) as { elements?: OverpassElement[] };
  const elements = payload.elements ?? [];

  return elements.slice(0, limit).flatMap((element) => {
    const tags = element.tags ?? {};
    const name = tags['name']?.trim();
    if (name === undefined || name === '') {
      return [];
    }
    const website = tags['website'] ?? tags['contact:website'] ?? null;
    const phone = tags['phone'] ?? tags['contact:phone'] ?? null;
    const latitude = element.lat ?? element.center?.lat ?? null;
    const longitude = element.lon ?? element.center?.lon ?? null;
    return [
      {
        name,
        category: input.category ?? value ?? null,
        phone,
        websiteUrl: website,
        address: tags['addr:street'] ?? null,
        city: tags['addr:city'] ?? city,
        region: tags['addr:state'] ?? null,
        postalCode: tags['addr:postcode'] ?? null,
        country: tags['addr:country'] ?? null,
        latitude,
        longitude,
        source: 'osm' as const,
        externalId: `${element.type}/${element.id}`,
      },
    ];
  });
}
