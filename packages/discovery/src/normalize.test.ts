import { describe, expect, it } from 'vitest';
import { computeOpportunityScore, dedupeCandidates, normalizeWebsite } from './normalize.js';

describe('discovery normalize', () => {
  it('dedupes by website and name', () => {
    const rows = dedupeCandidates([
      {
        name: 'Acme Dental',
        category: 'dentist',
        phone: null,
        websiteUrl: 'https://ACME.example/',
        address: null,
        city: 'Austin',
        region: null,
        postalCode: null,
        country: null,
        latitude: null,
        longitude: null,
        source: 'imported',
        externalId: '1',
      },
      {
        name: 'Acme Dental',
        category: 'dentist',
        phone: null,
        websiteUrl: 'https://acme.example',
        address: null,
        city: 'Austin',
        region: null,
        postalCode: null,
        country: null,
        latitude: null,
        longitude: null,
        source: 'imported',
        externalId: '2',
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(normalizeWebsite(rows[0]?.websiteUrl ?? null)).toContain('acme.example');
  });

  it('scores worse audits as higher opportunity', () => {
    expect(computeOpportunityScore({ websiteUrl: null, auditOverall: null }).score).toBe(100);
    expect(computeOpportunityScore({ websiteUrl: 'https://a.com', auditOverall: null }).score).toBe(
      80,
    );
    expect(computeOpportunityScore({ websiteUrl: 'https://a.com', auditOverall: 90 }).score).toBe(10);
  });
});
