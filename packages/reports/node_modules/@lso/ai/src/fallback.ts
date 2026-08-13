import type { AiAuditInput, AiNarrative } from './types.js';

/**
 * Deterministic narrative used when Ollama is disabled or unavailable.
 * Never invents scores or findings — only restates provided inputs.
 */
export function buildFallbackNarrative(input: AiAuditInput): AiNarrative {
  const fails = input.findings.filter((finding) => finding.outcome === 'FAIL');
  const warns = input.findings.filter((finding) => finding.outcome === 'WARN');
  const topRecs = input.recommendations
    .filter((rec) => rec.priority === 'high' || rec.priority === 'medium')
    .slice(0, 5);

  const business = input.businessName?.trim() ? ` for ${input.businessName.trim()}` : '';
  const performance =
    input.performanceScore === null
      ? 'Performance was not scored.'
      : `Performance score ${input.performanceScore}/100.`;

  return {
    executiveSummary: `SEO audit${business} for ${input.websiteUrl} scored ${input.overallScore}/100 overall (SEO ${input.seoScore}/100). ${performance} Found ${fails.length} failing and ${warns.length} warning checks from the deterministic rules engine.`,
    highlights: [
      `Overall score ${input.overallScore}/100 from rule outcomes (not AI-assigned).`,
      `${fails.length} FAIL and ${warns.length} WARN findings require attention.`,
      topRecs[0] !== undefined
        ? `Highest-priority action: ${topRecs[0].action}`
        : 'No high/medium priority recommendations were generated.',
    ],
    topActions: topRecs.map((rec) => ({
      ruleId: rec.ruleId ?? 'UNKNOWN',
      explanation: rec.action,
    })),
    caveats: [
      'This narrative restates stored findings and scores only.',
      'AI does not create findings, change scores, invent business data, or fetch URLs.',
    ],
  };
}
