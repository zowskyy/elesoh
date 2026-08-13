import { describe, expect, it } from 'vitest';
import { computeAuditScore } from './index.js';
import type { EvaluatedFinding } from '@lso/audits';

function finding(
  overrides: Partial<EvaluatedFinding> & Pick<EvaluatedFinding, 'outcome'>,
): EvaluatedFinding {
  return {
    ruleId: 'SEO-TEST',
    category: 'title',
    evidenceId: 'ev',
    summary: 'TEST',
    impact: 10,
    confidence: 1,
    effort: 1,
    action: 'fix',
    ...overrides,
  };
}

describe('computeAuditScore', () => {
  it('scores PASS as 100 and FAIL as 0 for equal weights', () => {
    const score = computeAuditScore({
      seoFindings: [finding({ outcome: 'PASS' }), finding({ outcome: 'FAIL', ruleId: 'SEO-TEST-2' })],
    });
    expect(score.seo).toBe(50);
    expect(score.overall).toBe(50);
    expect(score.performance).toBeNull();
  });
});
