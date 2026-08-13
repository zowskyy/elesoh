import { describe, expect, it } from 'vitest';
import type { Evidence, Finding } from './entities.js';

describe('Finding vs Evidence', () => {
  it('treats missing title as evidence, not a finding', () => {
    const evidence: Evidence = {
      id: '11111111-1111-4111-8111-111111111111',
      pageId: '22222222-2222-4222-8222-222222222222',
      kind: 'seo.meta',
      data: { title: null },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    expect(evidence.data['title']).toBeNull();
    expect(evidence).not.toHaveProperty('outcome');
    expect(evidence).not.toHaveProperty('ruleId');
  });

  it('encodes TITLE_MISSING as a finding outcome against evidence', () => {
    const finding: Finding = {
      id: '33333333-3333-4333-8333-333333333333',
      auditRunId: '44444444-4444-4444-8444-444444444444',
      evidenceId: '11111111-1111-4111-8111-111111111111',
      ruleId: 'SEO-TITLE-001',
      outcome: 'FAIL',
      summary: 'TITLE_MISSING',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    expect(finding.outcome).toBe('FAIL');
    expect(finding.summary).toBe('TITLE_MISSING');
    expect(finding).not.toHaveProperty('data');
  });
});
