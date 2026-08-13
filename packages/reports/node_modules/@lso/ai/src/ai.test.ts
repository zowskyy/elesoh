import { describe, expect, it } from 'vitest';
import { buildFallbackNarrative } from './fallback.js';
import { explainAudit } from './explain.js';

describe('AI narrative safety', () => {
  it('fallback restates provided scores and findings only', () => {
    const narrative = buildFallbackNarrative({
      websiteUrl: 'https://example.com',
      overallScore: 80,
      seoScore: 82,
      performanceScore: null,
      findings: [
        { ruleId: 'SEO-TITLE-001', outcome: 'FAIL', summary: 'TITLE_MISSING' },
        { ruleId: 'SEO-VIEW-001', outcome: 'WARN', summary: 'VIEWPORT_MISSING' },
      ],
      recommendations: [
        { ruleId: 'SEO-TITLE-001', priority: 'high', action: 'Add a title tag.' },
      ],
    });

    expect(narrative.executiveSummary).toContain('80/100');
    expect(narrative.executiveSummary).toContain('https://example.com');
    expect(narrative.topActions[0]?.ruleId).toBe('SEO-TITLE-001');
    expect(narrative.caveats.some((line) => line.includes('does not create findings'))).toBe(true);
  });

  it('uses fallback when AI is disabled', async () => {
    const result = await explainAudit(
      {
        websiteUrl: 'https://example.com',
        overallScore: 70,
        seoScore: 70,
        performanceScore: null,
        findings: [],
        recommendations: [],
      },
      {
        ollamaUrl: 'http://127.0.0.1:9',
        model: 'llama3.2',
        enabled: false,
      },
    );
    expect(result.source).toBe('fallback');
    expect(result.narrative.executiveSummary).toContain('70/100');
  });
});
