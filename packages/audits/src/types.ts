import type { CrawlPageSnapshot, FindingOutcome } from '@lso/domain';

export interface AuditContext {
  websiteUrl: string;
  pages: CrawlPageSnapshot[];
}

export interface RuleEvaluation {
  outcome: FindingOutcome;
  summary: string;
  impact: number;
  confidence: number;
  effort: number;
  action: string;
}

export interface EvaluatedFinding extends RuleEvaluation {
  ruleId: string;
  category: string;
  evidenceId: string;
}

export interface SeoRule {
  id: string;
  category: string;
  scope: 'page' | 'site';
  evaluatePage?: (page: CrawlPageSnapshot, ctx: AuditContext) => RuleEvaluation;
  evaluateSite?: (ctx: AuditContext) => EvaluatedFinding[];
}
