import type { DiscoveredBusiness } from './types.js';

export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ');
}

export function normalizeWebsite(url: string | null): string | null {
  if (url === null || url.trim() === '') {
    return null;
  }
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`);
    parsed.hash = '';
    parsed.search = '';
    parsed.username = '';
    parsed.password = '';
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname === '/') {
      return `${parsed.protocol}//${parsed.host}/`;
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function dedupeCandidates(candidates: DiscoveredBusiness[]): DiscoveredBusiness[] {
  const seenNames = new Set<string>();
  const seenSites = new Set<string>();
  const out: DiscoveredBusiness[] = [];

  for (const candidate of candidates) {
    const nameKey = normalizeName(candidate.name);
    if (nameKey === '') {
      continue;
    }
    const siteKey = normalizeWebsite(candidate.websiteUrl);
    if (siteKey !== null && seenSites.has(siteKey)) {
      continue;
    }
    if (seenNames.has(nameKey) && siteKey === null) {
      continue;
    }
    seenNames.add(nameKey);
    if (siteKey !== null) {
      seenSites.add(siteKey);
    }
    out.push({
      ...candidate,
      name: candidate.name.trim(),
      websiteUrl: siteKey,
      category: candidate.category?.trim() || null,
      phone: candidate.phone?.trim() || null,
    });
  }
  return out;
}

/**
 * Worse website (or no website / no audit) => higher opportunity.
 */
export function computeOpportunityScore(input: {
  websiteUrl: string | null;
  auditOverall: number | null;
}): { score: number; reason: string } {
  if (input.websiteUrl === null || input.websiteUrl.trim() === '') {
    return { score: 100, reason: 'No website listed' };
  }
  if (input.auditOverall === null) {
    return { score: 80, reason: 'Website present but not audited yet' };
  }
  const score = Math.max(0, Math.min(100, 100 - input.auditOverall));
  return {
    score,
    reason: `Audit overall ${input.auditOverall}/100 → opportunity ${score}`,
  };
}
