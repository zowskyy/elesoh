import type { EvaluatedFinding } from '@lso/audits';

export interface ScoreResult {
  overall: number;
  seo: number;
  performance: number | null;
  categories: Record<string, number>;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreFindings(findings: EvaluatedFinding[]): number {
  const applicable = findings.filter((finding) => finding.outcome !== 'NOT_APPLICABLE');
  if (applicable.length === 0) {
    return 100;
  }
  let points = 0;
  let weight = 0;
  for (const finding of applicable) {
    const w = Math.max(finding.impact, 1);
    weight += w;
    if (finding.outcome === 'PASS') {
      points += w;
    } else if (finding.outcome === 'WARN') {
      points += w * 0.5;
    }
  }
  return clampScore((points / weight) * 100);
}

/**
 * Deterministic score from rule evaluations. AI never sets this number.
 */
export function computeAuditScore(input: {
  seoFindings: EvaluatedFinding[];
  performanceFindings?: EvaluatedFinding[];
}): ScoreResult {
  const seo = scoreFindings(input.seoFindings);
  const performanceFindings = input.performanceFindings ?? [];
  const performance =
    performanceFindings.length === 0 ? null : scoreFindings(performanceFindings);

  const categories: Record<string, number> = {};
  const byCategory = new Map<string, EvaluatedFinding[]>();
  for (const finding of input.seoFindings) {
    const list = byCategory.get(finding.category) ?? [];
    list.push(finding);
    byCategory.set(finding.category, list);
  }
  for (const [category, findings] of byCategory) {
    categories[category] = scoreFindings(findings);
  }

  const overall =
    performance === null ? seo : clampScore(seo * 0.7 + performance * 0.3);

  return { overall, seo, performance, categories };
}
