export interface DiscoveredBusiness {
  name: string;
  category: string | null;
  phone: string | null;
  websiteUrl: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  source: 'imported' | 'osm';
  externalId: string | null;
}

export interface DiscoverQuery {
  provider: 'imported' | 'osm';
  imported?: DiscoveredBusiness[];
  osm?: {
    city: string;
    category?: string;
    limit?: number;
  };
}

export interface WebsiteVerification {
  url: string;
  ok: boolean;
  statusCode: number | null;
  error: string | null;
}

export interface OpportunityRow {
  businessId: string;
  name: string;
  websiteUrl: string | null;
  opportunityScore: number;
  auditScore: number | null;
  reason: string;
}
