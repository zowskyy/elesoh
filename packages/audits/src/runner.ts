import type { AuditContext, EvaluatedFinding, SeoRule } from './types.js';
import { SEO_RULES } from './rules.js';

export function runSeoRules(
  ctx: AuditContext,
  rules: SeoRule[] = SEO_RULES,
): EvaluatedFinding[] {
  if (ctx.pages.length === 0) {
    return [];
  }

  const findings: EvaluatedFinding[] = [];
  for (const rule of rules) {
    if (rule.scope === 'page' && rule.evaluatePage !== undefined) {
      for (const page of ctx.pages) {
        const result = rule.evaluatePage(page, ctx);
        findings.push({
          ruleId: rule.id,
          category: rule.category,
          evidenceId: page.evidenceId,
          ...result,
        });
      }
    }
    if (rule.scope === 'site' && rule.evaluateSite !== undefined) {
      findings.push(...rule.evaluateSite(ctx));
    }
  }
  return findings;
}

export function listRuleIds(rules: SeoRule[] = SEO_RULES): string[] {
  return rules.map((rule) => rule.id);
}
