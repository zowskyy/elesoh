import type { EvaluatedFinding } from './types.js';

export function recommendationPriority(finding: EvaluatedFinding): string {
  if (finding.outcome === 'PASS' || finding.outcome === 'NOT_APPLICABLE') {
    return 'none';
  }
  const effort = Math.max(finding.effort, 1);
  const score = (finding.impact * finding.confidence) / effort;
  if (score >= 3) return 'high';
  if (score >= 1.5) return 'medium';
  return 'low';
}

export function buildRecommendations(
  findings: EvaluatedFinding[],
): Array<{ ruleId: string; evidenceId: string; priority: string; action: string; summary: string }> {
  return findings
    .filter((finding) => finding.outcome === 'FAIL' || finding.outcome === 'WARN' || finding.outcome === 'ERROR')
    .map((finding) => ({
      ruleId: finding.ruleId,
      evidenceId: finding.evidenceId,
      priority: recommendationPriority(finding),
      action: finding.action,
      summary: finding.summary,
    }))
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2, none: 3 } as const;
      return rank[a.priority as keyof typeof rank] - rank[b.priority as keyof typeof rank];
    });
}
