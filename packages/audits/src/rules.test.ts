import { describe, expect, it } from 'vitest';
import { listRuleIds, runSeoRules } from './runner.js';
import type { AuditContext } from './types.js';

function samplePage(overrides: Partial<AuditContext['pages'][number]> = {}): AuditContext['pages'][number] {
  return {
    pageId: 'page-1',
    url: 'https://example.com/',
    statusCode: 200,
    evidenceId: 'ev-1',
    seo: {
      title: 'Example Domain Home Page Title',
      description: 'This is a sufficiently long meta description for the example home page content.',
      canonical: 'https://example.com/',
      robotsMeta: null,
      viewport: 'width=device-width, initial-scale=1',
      language: 'en',
      openGraph: { 'og:title': 'Example', 'og:description': 'Example description text' },
    },
    headings: [{ level: 1, text: 'Example Domain' }],
    links: [{ href: 'https://example.com/about' }],
    images: [{ src: 'https://example.com/logo.png', alt: 'Logo' }],
    ...overrides,
  };
}

describe('SEO rules', () => {
  it('registers 50 deterministic rules', () => {
    expect(listRuleIds()).toHaveLength(50);
  });

  it('flags missing title as FAIL evidence-backed finding', () => {
    const ctx: AuditContext = {
      websiteUrl: 'https://example.com/',
      pages: [
        samplePage({
          seo: {
            title: null,
            description: 'This is a sufficiently long meta description for the example home page content.',
            canonical: 'https://example.com/',
            robotsMeta: null,
            viewport: 'width=device-width, initial-scale=1',
            language: 'en',
            openGraph: {},
          },
        }),
      ],
    };
    const findings = runSeoRules(ctx);
    const titleMissing = findings.find((finding) => finding.ruleId === 'SEO-TITLE-001');
    expect(titleMissing?.outcome).toBe('FAIL');
    expect(titleMissing?.summary).toBe('TITLE_MISSING');
    expect(titleMissing?.evidenceId).toBe('ev-1');
  });
});
