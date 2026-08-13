import type { CrawlPageSnapshot } from '@lso/domain';
import type { AuditContext, EvaluatedFinding, RuleEvaluation, SeoRule } from './types.js';

function pageEval(
  id: string,
  category: string,
  evaluatePage: (page: CrawlPageSnapshot, ctx: AuditContext) => RuleEvaluation,
): SeoRule {
  return { id, category, scope: 'page', evaluatePage };
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function titleOf(page: CrawlPageSnapshot): string | null {
  return str(page.seo.title);
}

function descOf(page: CrawlPageSnapshot): string | null {
  return str(page.seo.description);
}

function isSameHost(websiteUrl: string, candidate: string): boolean {
  try {
    return new URL(candidate).hostname === new URL(websiteUrl).hostname;
  } catch {
    return false;
  }
}

function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export const SEO_RULES: SeoRule[] = [
  pageEval('SEO-TITLE-001', 'title', (page) => {
    const title = titleOf(page);
    if (title === null) {
      return {
        outcome: 'FAIL',
        summary: 'TITLE_MISSING',
        impact: 9,
        confidence: 1,
        effort: 2,
        action: 'Add a unique <title> to the page.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'TITLE_PRESENT',
      impact: 9,
      confidence: 1,
      effort: 1,
      action: 'Keep a descriptive title.',
    };
  }),
  pageEval('SEO-TITLE-002', 'title', (page) => {
    const title = titleOf(page);
    if (title === null) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'TITLE_LENGTH_SKIPPED',
        impact: 7,
        confidence: 1,
        effort: 2,
        action: 'Add a title before checking length.',
      };
    }
    const len = title.length;
    if (len < 30) {
      return {
        outcome: 'WARN',
        summary: 'TITLE_TOO_SHORT',
        impact: 6,
        confidence: 0.9,
        effort: 2,
        action: 'Expand the title to roughly 30–60 characters.',
      };
    }
    if (len > 60) {
      return {
        outcome: 'WARN',
        summary: 'TITLE_TOO_LONG',
        impact: 5,
        confidence: 0.9,
        effort: 2,
        action: 'Shorten the title to roughly 30–60 characters.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'TITLE_LENGTH_OK',
      impact: 6,
      confidence: 0.9,
      effort: 1,
      action: 'Maintain title length.',
    };
  }),
  pageEval('SEO-DESC-001', 'meta', (page) => {
    const description = descOf(page);
    if (description === null) {
      return {
        outcome: 'FAIL',
        summary: 'DESCRIPTION_MISSING',
        impact: 8,
        confidence: 1,
        effort: 2,
        action: 'Add a meta description.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'DESCRIPTION_PRESENT',
      impact: 8,
      confidence: 1,
      effort: 1,
      action: 'Keep a unique meta description.',
    };
  }),
  pageEval('SEO-DESC-002', 'meta', (page) => {
    const description = descOf(page);
    if (description === null) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'DESCRIPTION_LENGTH_SKIPPED',
        impact: 5,
        confidence: 1,
        effort: 2,
        action: 'Add a description first.',
      };
    }
    const len = description.length;
    if (len < 70) {
      return {
        outcome: 'WARN',
        summary: 'DESCRIPTION_TOO_SHORT',
        impact: 5,
        confidence: 0.85,
        effort: 2,
        action: 'Expand the meta description to roughly 70–160 characters.',
      };
    }
    if (len > 160) {
      return {
        outcome: 'WARN',
        summary: 'DESCRIPTION_TOO_LONG',
        impact: 4,
        confidence: 0.85,
        effort: 2,
        action: 'Shorten the meta description to roughly 70–160 characters.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'DESCRIPTION_LENGTH_OK',
      impact: 5,
      confidence: 0.85,
      effort: 1,
      action: 'Maintain description length.',
    };
  }),
  pageEval('SEO-CANON-001', 'canonical', (page) => {
    const canonical = str(page.seo.canonical);
    if (canonical === null) {
      return {
        outcome: 'WARN',
        summary: 'CANONICAL_MISSING',
        impact: 6,
        confidence: 0.9,
        effort: 2,
        action: 'Add a rel=canonical link.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'CANONICAL_PRESENT',
      impact: 6,
      confidence: 0.9,
      effort: 1,
      action: 'Keep a correct canonical URL.',
    };
  }),
  pageEval('SEO-CANON-002', 'canonical', (page, ctx) => {
    const canonical = str(page.seo.canonical);
    if (canonical === null) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'CANONICAL_HOST_SKIPPED',
        impact: 7,
        confidence: 1,
        effort: 2,
        action: 'Add a canonical first.',
      };
    }
    if (!isSameHost(ctx.websiteUrl, canonical)) {
      return {
        outcome: 'FAIL',
        summary: 'CANONICAL_OFF_HOST',
        impact: 8,
        confidence: 0.95,
        effort: 3,
        action: 'Point canonical to the same host as the website.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'CANONICAL_HOST_OK',
      impact: 7,
      confidence: 0.95,
      effort: 1,
      action: 'Keep canonical on-host.',
    };
  }),
  pageEval('SEO-CANON-003', 'canonical', (page) => {
    const canonical = str(page.seo.canonical);
    if (canonical === null) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'CANONICAL_ABSOLUTE_SKIPPED',
        impact: 4,
        confidence: 1,
        effort: 2,
        action: 'Add a canonical first.',
      };
    }
    if (!/^https?:\/\//i.test(canonical)) {
      return {
        outcome: 'WARN',
        summary: 'CANONICAL_NOT_ABSOLUTE',
        impact: 4,
        confidence: 0.9,
        effort: 2,
        action: 'Use an absolute http(s) canonical URL.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'CANONICAL_ABSOLUTE',
      impact: 4,
      confidence: 0.9,
      effort: 1,
      action: 'Keep absolute canonical URLs.',
    };
  }),
  pageEval('SEO-ROBOTS-001', 'robots', (page) => {
    const robots = str(page.seo.robotsMeta)?.toLowerCase() ?? null;
    if (robots === null) {
      return {
        outcome: 'PASS',
        summary: 'ROBOTS_META_DEFAULT',
        impact: 5,
        confidence: 0.8,
        effort: 1,
        action: 'Default indexability is fine unless intentionally blocking.',
      };
    }
    if (robots.includes('noindex')) {
      return {
        outcome: 'WARN',
        summary: 'ROBOTS_NOINDEX',
        impact: 8,
        confidence: 1,
        effort: 2,
        action: 'Remove noindex unless the page should stay out of search.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'ROBOTS_META_OK',
      impact: 5,
      confidence: 0.9,
      effort: 1,
      action: 'Keep robots meta intentional.',
    };
  }),
  pageEval('SEO-VIEW-001', 'meta', (page) => {
    if (str(page.seo.viewport) === null) {
      return {
        outcome: 'FAIL',
        summary: 'VIEWPORT_MISSING',
        impact: 7,
        confidence: 1,
        effort: 1,
        action: 'Add a mobile viewport meta tag.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'VIEWPORT_PRESENT',
      impact: 7,
      confidence: 1,
      effort: 1,
      action: 'Keep viewport configured.',
    };
  }),
  pageEval('SEO-LANG-001', 'meta', (page) => {
    if (str(page.seo.language) === null) {
      return {
        outcome: 'WARN',
        summary: 'HTML_LANG_MISSING',
        impact: 4,
        confidence: 0.95,
        effort: 1,
        action: 'Set the html lang attribute.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'HTML_LANG_PRESENT',
      impact: 4,
      confidence: 0.95,
      effort: 1,
      action: 'Keep html lang accurate.',
    };
  }),
  pageEval('SEO-H1-001', 'headings', (page) => {
    const h1 = page.headings.filter((heading) => heading.level === 1);
    if (h1.length === 0) {
      return {
        outcome: 'FAIL',
        summary: 'H1_MISSING',
        impact: 8,
        confidence: 1,
        effort: 2,
        action: 'Add a single H1 heading.',
      };
    }
    if (h1.length > 1) {
      return {
        outcome: 'WARN',
        summary: 'H1_MULTIPLE',
        impact: 5,
        confidence: 0.95,
        effort: 3,
        action: 'Use exactly one H1 per page.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'H1_SINGLE',
      impact: 8,
      confidence: 1,
      effort: 1,
      action: 'Keep a single H1.',
    };
  }),
  pageEval('SEO-H1-002', 'headings', (page) => {
    const h1 = page.headings.find((heading) => heading.level === 1);
    if (h1 === undefined) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'H1_EMPTY_SKIPPED',
        impact: 6,
        confidence: 1,
        effort: 2,
        action: 'Add an H1 first.',
      };
    }
    if (h1.text.trim() === '') {
      return {
        outcome: 'FAIL',
        summary: 'H1_EMPTY',
        impact: 6,
        confidence: 1,
        effort: 1,
        action: 'Put descriptive text in the H1.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'H1_NONEMPTY',
      impact: 6,
      confidence: 1,
      effort: 1,
      action: 'Keep H1 text meaningful.',
    };
  }),
  pageEval('SEO-H1-003', 'headings', (page) => {
    const h1 = page.headings.find((heading) => heading.level === 1);
    const title = titleOf(page);
    if (h1 === undefined || title === null) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'H1_TITLE_COMPARE_SKIPPED',
        impact: 3,
        confidence: 1,
        effort: 2,
        action: 'Ensure both title and H1 exist.',
      };
    }
    if (h1.text.trim().toLowerCase() === title.toLowerCase()) {
      return {
        outcome: 'PASS',
        summary: 'H1_MATCHES_TITLE',
        impact: 3,
        confidence: 0.7,
        effort: 1,
        action: 'Matching H1/title is acceptable.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'H1_DIFFERS_FROM_TITLE',
      impact: 3,
      confidence: 0.7,
      effort: 1,
      action: 'Distinct H1/title is fine when both are descriptive.',
    };
  }),
  pageEval('SEO-H2-001', 'headings', (page) => {
    const hasH2 = page.headings.some((heading) => heading.level === 2);
    if (!hasH2 && page.headings.length > 1) {
      return {
        outcome: 'WARN',
        summary: 'H2_MISSING',
        impact: 3,
        confidence: 0.7,
        effort: 3,
        action: 'Add H2 sections to structure content.',
      };
    }
    if (!hasH2) {
      return {
        outcome: 'PASS',
        summary: 'H2_OPTIONAL_SHORT_PAGE',
        impact: 3,
        confidence: 0.6,
        effort: 1,
        action: 'H2 optional on very short pages.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'H2_PRESENT',
      impact: 3,
      confidence: 0.8,
      effort: 1,
      action: 'Keep heading structure.',
    };
  }),
  pageEval('SEO-HEAD-001', 'headings', (page) => {
    const levels = page.headings.map((heading) => heading.level);
    for (let i = 1; i < levels.length; i += 1) {
      const prev = levels[i - 1] ?? 1;
      const curr = levels[i] ?? 1;
      if (curr > prev + 1) {
        return {
          outcome: 'WARN',
          summary: 'HEADING_LEVEL_SKIP',
          impact: 3,
          confidence: 0.8,
          effort: 3,
          action: 'Avoid skipping heading levels (for example H1 to H3).',
        };
      }
    }
    return {
      outcome: 'PASS',
      summary: 'HEADING_LEVELS_OK',
      impact: 3,
      confidence: 0.8,
      effort: 1,
      action: 'Keep sequential heading levels.',
    };
  }),
  pageEval('SEO-IMG-001', 'images', (page) => {
    if (page.images.length === 0) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'NO_IMAGES',
        impact: 5,
        confidence: 1,
        effort: 1,
        action: 'No images to evaluate.',
      };
    }
    const missing = page.images.filter((image) => image.alt === null || image.alt.trim() === '');
    if (missing.length > 0) {
      return {
        outcome: 'FAIL',
        summary: 'IMAGE_ALT_MISSING',
        impact: 6,
        confidence: 0.95,
        effort: 3,
        action: `Add alt text to ${missing.length} image(s).`,
      };
    }
    return {
      outcome: 'PASS',
      summary: 'IMAGE_ALT_OK',
      impact: 6,
      confidence: 0.95,
      effort: 1,
      action: 'Keep descriptive alt text.',
    };
  }),
  pageEval('SEO-IMG-002', 'images', (page) => {
    if (page.images.length === 0) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'IMAGE_COUNT_SKIPPED',
        impact: 2,
        confidence: 1,
        effort: 1,
        action: 'No images present.',
      };
    }
    if (page.images.length > 50) {
      return {
        outcome: 'WARN',
        summary: 'TOO_MANY_IMAGES',
        impact: 2,
        confidence: 0.7,
        effort: 4,
        action: 'Reduce or lazy-load large image sets.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'IMAGE_COUNT_OK',
      impact: 2,
      confidence: 0.7,
      effort: 1,
      action: 'Image count looks reasonable.',
    };
  }),
  pageEval('SEO-IMG-003', 'images', (page) => {
    if (page.images.length === 0) {
      return {
        outcome: 'WARN',
        summary: 'NO_CONTENT_IMAGES',
        impact: 2,
        confidence: 0.5,
        effort: 4,
        action: 'Consider adding relevant images when helpful.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'HAS_IMAGES',
      impact: 2,
      confidence: 0.5,
      effort: 1,
      action: 'Images present.',
    };
  }),
  pageEval('SEO-LINK-001', 'links', (page) => {
    if (page.links.length === 0) {
      return {
        outcome: 'WARN',
        summary: 'NO_LINKS',
        impact: 4,
        confidence: 0.8,
        effort: 3,
        action: 'Add navigational or contextual links.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'HAS_LINKS',
      impact: 4,
      confidence: 0.8,
      effort: 1,
      action: 'Keep useful internal linking.',
    };
  }),
  pageEval('SEO-LINK-002', 'links', (page) => {
    const empty = page.links.filter((link) => link.href.trim() === '' || link.href === '#');
    if (empty.length > 0) {
      return {
        outcome: 'WARN',
        summary: 'EMPTY_OR_HASH_LINKS',
        impact: 3,
        confidence: 0.85,
        effort: 2,
        action: 'Replace empty/# links with real destinations.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'LINK_HREFS_OK',
      impact: 3,
      confidence: 0.85,
      effort: 1,
      action: 'Link hrefs look usable.',
    };
  }),
  pageEval('SEO-LINK-003', 'links', (page, ctx) => {
    let host: string;
    try {
      host = new URL(ctx.websiteUrl).hostname;
    } catch {
      return {
        outcome: 'ERROR',
        summary: 'WEBSITE_URL_INVALID',
        impact: 3,
        confidence: 1,
        effort: 1,
        action: 'Fix website URL configuration.',
      };
    }
    const external = page.links.filter((link) => {
      try {
        return new URL(link.href).hostname !== host;
      } catch {
        return false;
      }
    });
    if (external.length > 100) {
      return {
        outcome: 'WARN',
        summary: 'MANY_EXTERNAL_LINKS',
        impact: 2,
        confidence: 0.6,
        effort: 3,
        action: 'Review unusually large external link sets.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'EXTERNAL_LINK_COUNT_OK',
      impact: 2,
      confidence: 0.6,
      effort: 1,
      action: 'External link volume looks fine.',
    };
  }),
  pageEval('SEO-OG-001', 'social', (page) => {
    if (str(page.seo.openGraph['og:title']) === null) {
      return {
        outcome: 'WARN',
        summary: 'OG_TITLE_MISSING',
        impact: 4,
        confidence: 0.9,
        effort: 2,
        action: 'Add og:title for social previews.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'OG_TITLE_PRESENT',
      impact: 4,
      confidence: 0.9,
      effort: 1,
      action: 'Keep og:title updated.',
    };
  }),
  pageEval('SEO-OG-002', 'social', (page) => {
    if (str(page.seo.openGraph['og:description']) === null) {
      return {
        outcome: 'WARN',
        summary: 'OG_DESCRIPTION_MISSING',
        impact: 3,
        confidence: 0.85,
        effort: 2,
        action: 'Add og:description.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'OG_DESCRIPTION_PRESENT',
      impact: 3,
      confidence: 0.85,
      effort: 1,
      action: 'Keep og:description updated.',
    };
  }),
  pageEval('SEO-OG-003', 'social', (page) => {
    const ogTitle = str(page.seo.openGraph['og:title']);
    const title = titleOf(page);
    if (ogTitle === null || title === null) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'OG_TITLE_COMPARE_SKIPPED',
        impact: 2,
        confidence: 1,
        effort: 1,
        action: 'Ensure title and og:title exist.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'OG_TITLE_COMPARED',
      impact: 2,
      confidence: 0.6,
      effort: 1,
      action: 'og:title present for comparison.',
    };
  }),
  pageEval('SEO-STATUS-001', 'http', (page) => {
    if (page.statusCode === null) {
      return {
        outcome: 'ERROR',
        summary: 'STATUS_UNKNOWN',
        impact: 7,
        confidence: 0.7,
        effort: 3,
        action: 'Re-crawl to capture HTTP status.',
      };
    }
    if (page.statusCode === 200) {
      return {
        outcome: 'PASS',
        summary: 'STATUS_200',
        impact: 9,
        confidence: 1,
        effort: 1,
        action: 'Keep the page returning 200.',
      };
    }
    if (page.statusCode >= 300 && page.statusCode < 400) {
      return {
        outcome: 'WARN',
        summary: 'STATUS_REDIRECT',
        impact: 5,
        confidence: 0.9,
        effort: 3,
        action: 'Prefer final URLs over intermediate redirects in the crawl set.',
      };
    }
    return {
      outcome: 'FAIL',
      summary: 'STATUS_NOT_OK',
      impact: 9,
      confidence: 1,
      effort: 4,
      action: `Fix HTTP status ${page.statusCode}.`,
    };
  }),
  pageEval('SEO-STATUS-002', 'http', (page) => {
    if (page.statusCode !== null && page.statusCode >= 400) {
      return {
        outcome: 'FAIL',
        summary: 'STATUS_CLIENT_OR_SERVER_ERROR',
        impact: 10,
        confidence: 1,
        effort: 5,
        action: 'Resolve 4xx/5xx responses before SEO work.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'STATUS_NO_ERROR_CODE',
      impact: 10,
      confidence: 1,
      effort: 1,
      action: 'No HTTP error status observed.',
    };
  }),
  pageEval('SEO-HTTPS-001', 'http', (page) => {
    if (page.url.startsWith('https://')) {
      return {
        outcome: 'PASS',
        summary: 'HTTPS_OK',
        impact: 8,
        confidence: 1,
        effort: 1,
        action: 'Keep serving over HTTPS.',
      };
    }
    if (page.url.startsWith('http://127.') || page.url.includes('localhost')) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'HTTPS_LOCAL_SKIPPED',
        impact: 8,
        confidence: 1,
        effort: 1,
        action: 'Local fixture URLs skip HTTPS checks.',
      };
    }
    return {
      outcome: 'FAIL',
      summary: 'HTTPS_MISSING',
      impact: 8,
      confidence: 1,
      effort: 4,
      action: 'Serve the site over HTTPS.',
    };
  }),
  pageEval('SEO-URL-001', 'url', (page) => {
    if (page.url.length > 115) {
      return {
        outcome: 'WARN',
        summary: 'URL_TOO_LONG',
        impact: 3,
        confidence: 0.8,
        effort: 4,
        action: 'Shorten the URL path where practical.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'URL_LENGTH_OK',
      impact: 3,
      confidence: 0.8,
      effort: 1,
      action: 'URL length looks fine.',
    };
  }),
  pageEval('SEO-URL-002', 'url', (page) => {
    const path = pathOf(page.url);
    if (path !== path.toLowerCase()) {
      return {
        outcome: 'WARN',
        summary: 'URL_HAS_UPPERCASE',
        impact: 2,
        confidence: 0.75,
        effort: 3,
        action: 'Prefer lowercase URL paths.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'URL_LOWERCASE',
      impact: 2,
      confidence: 0.75,
      effort: 1,
      action: 'URL path casing looks fine.',
    };
  }),
  pageEval('SEO-TITLE-004', 'title', (page) => {
    const title = titleOf(page);
    const description = descOf(page);
    if (title === null || description === null) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'TITLE_DESC_COMPARE_SKIPPED',
        impact: 4,
        confidence: 1,
        effort: 1,
        action: 'Ensure title and description both exist.',
      };
    }
    if (title.toLowerCase() === description.toLowerCase()) {
      return {
        outcome: 'WARN',
        summary: 'TITLE_EQUALS_DESCRIPTION',
        impact: 4,
        confidence: 0.95,
        effort: 2,
        action: 'Make the meta description distinct from the title.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'TITLE_DIFFERS_DESCRIPTION',
      impact: 4,
      confidence: 0.95,
      effort: 1,
      action: 'Title and description are distinct.',
    };
  }),
  pageEval('SEO-TITLE-005', 'title', (page) => {
    const title = titleOf(page);
    if (title === null) {
      return {
        outcome: 'NOT_APPLICABLE',
        summary: 'TITLE_STUFFING_SKIPPED',
        impact: 4,
        confidence: 1,
        effort: 1,
        action: 'Add a title first.',
      };
    }
    const words = title.toLowerCase().split(/\s+/).filter(Boolean);
    const counts = new Map<string, number>();
    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
    const stuffed = [...counts.values()].some((count) => count >= 4);
    if (stuffed) {
      return {
        outcome: 'WARN',
        summary: 'TITLE_KEYWORD_STUFFING',
        impact: 4,
        confidence: 0.7,
        effort: 2,
        action: 'Reduce repeated words in the title.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'TITLE_NO_STUFFING',
      impact: 4,
      confidence: 0.7,
      effort: 1,
      action: 'Title wording looks natural.',
    };
  }),
  pageEval('SEO-CRAWL-001', 'crawl', (page) => {
    if (page.evidenceId === '') {
      return {
        outcome: 'ERROR',
        summary: 'EVIDENCE_MISSING',
        impact: 10,
        confidence: 1,
        effort: 5,
        action: 'Re-run crawl to capture evidence.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'EVIDENCE_PRESENT',
      impact: 10,
      confidence: 1,
      effort: 1,
      action: 'Evidence captured for the page.',
    };
  }),
  pageEval('SEO-META-001', 'meta', (page) => {
    const title = titleOf(page);
    if (title !== null && title.length > 0) {
      return {
        outcome: 'PASS',
        summary: 'DOCUMENT_TITLE_SINGLE',
        impact: 3,
        confidence: 0.8,
        effort: 1,
        action: 'Document title observed.',
      };
    }
    return {
      outcome: 'FAIL',
      summary: 'DOCUMENT_TITLE_ABSENT',
      impact: 3,
      confidence: 0.8,
      effort: 2,
      action: 'Ensure the document exposes a title.',
    };
  }),
  pageEval('SEO-SOCIAL-001', 'social', (page) => {
    const keys = Object.keys(page.seo.openGraph);
    if (keys.length === 0) {
      return {
        outcome: 'WARN',
        summary: 'OPEN_GRAPH_EMPTY',
        impact: 3,
        confidence: 0.85,
        effort: 3,
        action: 'Add basic Open Graph tags.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'OPEN_GRAPH_PRESENT',
      impact: 3,
      confidence: 0.85,
      effort: 1,
      action: 'Open Graph tags detected.',
    };
  }),
  pageEval('SEO-CONTENT-001', 'content', (page) => {
    if (page.headings.length === 0 && titleOf(page) === null) {
      return {
        outcome: 'FAIL',
        summary: 'NO_TEXTUAL_SIGNALS',
        impact: 7,
        confidence: 0.8,
        effort: 4,
        action: 'Ensure the page exposes title/headings for SEO.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'TEXTUAL_SIGNALS_PRESENT',
      impact: 7,
      confidence: 0.8,
      effort: 1,
      action: 'Basic textual SEO signals present.',
    };
  }),
  pageEval('SEO-CONTENT-002', 'content', (page) => {
    const textBits = [
      titleOf(page) ?? '',
      descOf(page) ?? '',
      ...page.headings.map((heading) => heading.text),
    ]
      .join(' ')
      .trim();
    if (textBits.length < 20) {
      return {
        outcome: 'WARN',
        summary: 'THIN_EXTRACTED_TEXT',
        impact: 5,
        confidence: 0.6,
        effort: 4,
        action: 'Add more descriptive on-page copy.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'EXTRACTED_TEXT_OK',
      impact: 5,
      confidence: 0.6,
      effort: 1,
      action: 'Extracted text volume looks adequate.',
    };
  }),
  pageEval('SEO-NAV-001', 'links', (page, ctx) => {
    let host: string;
    try {
      host = new URL(ctx.websiteUrl).hostname;
    } catch {
      return {
        outcome: 'ERROR',
        summary: 'NAV_HOST_INVALID',
        impact: 4,
        confidence: 1,
        effort: 1,
        action: 'Fix website URL.',
      };
    }
    const internal = page.links.filter((link) => {
      try {
        return new URL(link.href).hostname === host;
      } catch {
        return false;
      }
    });
    if (internal.length === 0 && page.links.length > 0) {
      return {
        outcome: 'WARN',
        summary: 'NO_INTERNAL_LINKS',
        impact: 5,
        confidence: 0.8,
        effort: 3,
        action: 'Add internal links to related pages.',
      };
    }
    return {
      outcome: 'PASS',
      summary: 'INTERNAL_LINKS_OK',
      impact: 5,
      confidence: 0.8,
      effort: 1,
      action: 'Internal linking present or no outbound-only set.',
    };
  }),
  pageEval('SEO-PERF-PROXY-001', 'http', (page) => {
    if (page.statusCode === 200 && page.url.length < 80) {
      return {
        outcome: 'PASS',
        summary: 'BASIC_DELIVERY_OK',
        impact: 2,
        confidence: 0.4,
        effort: 1,
        action: 'Basic delivery signals look fine; run full performance for metrics.',
      };
    }
    return {
      outcome: 'WARN',
      summary: 'BASIC_DELIVERY_REVIEW',
      impact: 2,
      confidence: 0.4,
      effort: 3,
      action: 'Review delivery and consider a full performance audit.',
    };
  }),
  {
    id: 'SEO-TITLE-003',
    category: 'title',
    scope: 'site',
    evaluateSite: (ctx) => {
      const grouped = new Map<string, CrawlPageSnapshot[]>();
      for (const page of ctx.pages) {
        const title = titleOf(page);
        if (title === null) continue;
        const key = title.toLowerCase();
        const list = grouped.get(key) ?? [];
        list.push(page);
        grouped.set(key, list);
      }
      const findings: EvaluatedFinding[] = [];
      for (const [, pages] of grouped) {
        if (pages.length < 2) continue;
        for (const page of pages) {
          findings.push({
            ruleId: 'SEO-TITLE-003',
            category: 'title',
            evidenceId: page.evidenceId,
            outcome: 'FAIL',
            summary: 'TITLE_DUPLICATE',
            impact: 7,
            confidence: 0.95,
            effort: 3,
            action: 'Make each page title unique.',
          });
        }
      }
      if (findings.length === 0 && ctx.pages[0] !== undefined) {
        findings.push({
          ruleId: 'SEO-TITLE-003',
          category: 'title',
          evidenceId: ctx.pages[0].evidenceId,
          outcome: 'PASS',
          summary: 'TITLES_UNIQUE',
          impact: 7,
          confidence: 0.95,
          effort: 1,
          action: 'Keep page titles unique.',
        });
      }
      return findings;
    },
  },
  {
    id: 'SEO-DESC-003',
    category: 'meta',
    scope: 'site',
    evaluateSite: (ctx) => {
      const grouped = new Map<string, CrawlPageSnapshot[]>();
      for (const page of ctx.pages) {
        const description = descOf(page);
        if (description === null) continue;
        const key = description.toLowerCase();
        const list = grouped.get(key) ?? [];
        list.push(page);
        grouped.set(key, list);
      }
      const findings: EvaluatedFinding[] = [];
      for (const [, pages] of grouped) {
        if (pages.length < 2) continue;
        for (const page of pages) {
          findings.push({
            ruleId: 'SEO-DESC-003',
            category: 'meta',
            evidenceId: page.evidenceId,
            outcome: 'WARN',
            summary: 'DESCRIPTION_DUPLICATE',
            impact: 5,
            confidence: 0.9,
            effort: 3,
            action: 'Write a unique meta description per page.',
          });
        }
      }
      if (findings.length === 0 && ctx.pages[0] !== undefined) {
        findings.push({
          ruleId: 'SEO-DESC-003',
          category: 'meta',
          evidenceId: ctx.pages[0].evidenceId,
          outcome: 'PASS',
          summary: 'DESCRIPTIONS_UNIQUE',
          impact: 5,
          confidence: 0.9,
          effort: 1,
          action: 'Keep descriptions unique.',
        });
      }
      return findings;
    },
  },
  {
    id: 'SEO-SITE-001',
    category: 'crawl',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) {
        return [];
      }
      if (ctx.pages.length === 0) {
        return [
          {
            ruleId: 'SEO-SITE-001',
            category: 'crawl',
            evidenceId: page.evidenceId,
            outcome: 'FAIL',
            summary: 'NO_PAGES_IN_CRAWL',
            impact: 10,
            confidence: 1,
            effort: 5,
            action: 'Re-run crawl; no pages available for audit.',
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-001',
          category: 'crawl',
          evidenceId: page.evidenceId,
          outcome: 'PASS',
          summary: 'PAGES_AVAILABLE',
          impact: 10,
          confidence: 1,
          effort: 1,
          action: 'Crawl produced pages for audit.',
        },
      ];
    },
  },
  {
    id: 'SEO-SITE-002',
    category: 'http',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) return [];
      const errors = ctx.pages.filter(
        (entry) => entry.statusCode !== null && entry.statusCode >= 400,
      );
      if (errors.length > 0) {
        return [
          {
            ruleId: 'SEO-SITE-002',
            category: 'http',
            evidenceId: page.evidenceId,
            outcome: 'FAIL',
            summary: 'SITE_HAS_ERROR_PAGES',
            impact: 8,
            confidence: 1,
            effort: 5,
            action: `Fix ${errors.length} page(s) returning 4xx/5xx.`,
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-002',
          category: 'http',
          evidenceId: page.evidenceId,
          outcome: 'PASS',
          summary: 'SITE_NO_ERROR_PAGES',
          impact: 8,
          confidence: 1,
          effort: 1,
          action: 'No error status pages in crawl set.',
        },
      ];
    },
  },
  {
    id: 'SEO-SITE-003',
    category: 'content',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) return [];
      const missingTitle = ctx.pages.filter((entry) => titleOf(entry) === null).length;
      const ratio = missingTitle / ctx.pages.length;
      if (ratio > 0.25) {
        return [
          {
            ruleId: 'SEO-SITE-003',
            category: 'content',
            evidenceId: page.evidenceId,
            outcome: 'FAIL',
            summary: 'SITE_MANY_MISSING_TITLES',
            impact: 8,
            confidence: 0.95,
            effort: 4,
            action: 'Add titles across pages missing them.',
          },
        ];
      }
      if (missingTitle > 0) {
        return [
          {
            ruleId: 'SEO-SITE-003',
            category: 'content',
            evidenceId: page.evidenceId,
            outcome: 'WARN',
            summary: 'SITE_SOME_MISSING_TITLES',
            impact: 6,
            confidence: 0.95,
            effort: 3,
            action: 'Fill remaining missing titles.',
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-003',
          category: 'content',
          evidenceId: page.evidenceId,
          outcome: 'PASS',
          summary: 'SITE_TITLES_COMPLETE',
          impact: 6,
          confidence: 0.95,
          effort: 1,
          action: 'All crawled pages have titles.',
        },
      ];
    },
  },
  {
    id: 'SEO-SITE-004',
    category: 'meta',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) return [];
      const missing = ctx.pages.filter((entry) => descOf(entry) === null).length;
      if (missing === 0) {
        return [
          {
            ruleId: 'SEO-SITE-004',
            category: 'meta',
            evidenceId: page.evidenceId,
            outcome: 'PASS',
            summary: 'SITE_DESCRIPTIONS_COMPLETE',
            impact: 5,
            confidence: 0.9,
            effort: 1,
            action: 'All pages have descriptions.',
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-004',
          category: 'meta',
          evidenceId: page.evidenceId,
          outcome: 'WARN',
          summary: 'SITE_SOME_MISSING_DESCRIPTIONS',
          impact: 5,
          confidence: 0.9,
          effort: 3,
          action: `Add meta descriptions on ${missing} page(s).`,
        },
      ];
    },
  },
  {
    id: 'SEO-SITE-005',
    category: 'images',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) return [];
      let missingAlt = 0;
      for (const entry of ctx.pages) {
        missingAlt += entry.images.filter(
          (image) => image.alt === null || image.alt.trim() === '',
        ).length;
      }
      if (missingAlt === 0) {
        return [
          {
            ruleId: 'SEO-SITE-005',
            category: 'images',
            evidenceId: page.evidenceId,
            outcome: 'PASS',
            summary: 'SITE_IMAGE_ALT_COMPLETE',
            impact: 5,
            confidence: 0.9,
            effort: 1,
            action: 'Image alt coverage looks complete.',
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-005',
          category: 'images',
          evidenceId: page.evidenceId,
          outcome: 'WARN',
          summary: 'SITE_IMAGE_ALT_GAPS',
          impact: 5,
          confidence: 0.9,
          effort: 4,
          action: `Add alt text to ${missingAlt} image(s) site-wide.`,
        },
      ];
    },
  },
  {
    id: 'SEO-SITE-006',
    category: 'canonical',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) return [];
      const missing = ctx.pages.filter((entry) => str(entry.seo.canonical) === null).length;
      if (missing === 0) {
        return [
          {
            ruleId: 'SEO-SITE-006',
            category: 'canonical',
            evidenceId: page.evidenceId,
            outcome: 'PASS',
            summary: 'SITE_CANONICALS_COMPLETE',
            impact: 4,
            confidence: 0.85,
            effort: 1,
            action: 'Canonicals present on crawled pages.',
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-006',
          category: 'canonical',
          evidenceId: page.evidenceId,
          outcome: 'WARN',
          summary: 'SITE_SOME_MISSING_CANONICALS',
          impact: 4,
          confidence: 0.85,
          effort: 3,
          action: `Add canonicals on ${missing} page(s).`,
        },
      ];
    },
  },
  {
    id: 'SEO-SITE-007',
    category: 'crawl',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) return [];
      if (ctx.pages.length === 1) {
        return [
          {
            ruleId: 'SEO-SITE-007',
            category: 'crawl',
            evidenceId: page.evidenceId,
            outcome: 'WARN',
            summary: 'SINGLE_PAGE_CRAWL',
            impact: 3,
            confidence: 0.7,
            effort: 3,
            action: 'Confirm crawl depth/links if more pages are expected.',
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-007',
          category: 'crawl',
          evidenceId: page.evidenceId,
          outcome: 'PASS',
          summary: 'MULTI_PAGE_CRAWL',
          impact: 3,
          confidence: 0.7,
          effort: 1,
          action: 'Multiple pages available for site analysis.',
        },
      ];
    },
  },
  {
    id: 'SEO-SITE-008',
    category: 'social',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) return [];
      const withOg = ctx.pages.filter((entry) => Object.keys(entry.seo.openGraph).length > 0).length;
      if (withOg === 0) {
        return [
          {
            ruleId: 'SEO-SITE-008',
            category: 'social',
            evidenceId: page.evidenceId,
            outcome: 'WARN',
            summary: 'SITE_NO_OPEN_GRAPH',
            impact: 3,
            confidence: 0.85,
            effort: 4,
            action: 'Add Open Graph tags across key pages.',
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-008',
          category: 'social',
          evidenceId: page.evidenceId,
          outcome: 'PASS',
          summary: 'SITE_HAS_OPEN_GRAPH',
          impact: 3,
          confidence: 0.85,
          effort: 1,
          action: 'Open Graph present on at least one page.',
        },
      ];
    },
  },
  {
    id: 'SEO-SITE-009',
    category: 'http',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) return [];
      const httpsCount = ctx.pages.filter((entry) => entry.url.startsWith('https://')).length;
      const local = ctx.pages.every(
        (entry) => entry.url.includes('127.0.0.1') || entry.url.includes('localhost'),
      );
      if (local) {
        return [
          {
            ruleId: 'SEO-SITE-009',
            category: 'http',
            evidenceId: page.evidenceId,
            outcome: 'NOT_APPLICABLE',
            summary: 'SITE_HTTPS_LOCAL_SKIPPED',
            impact: 7,
            confidence: 1,
            effort: 1,
            action: 'Local fixture skips site HTTPS rollup.',
          },
        ];
      }
      if (httpsCount !== ctx.pages.length) {
        return [
          {
            ruleId: 'SEO-SITE-009',
            category: 'http',
            evidenceId: page.evidenceId,
            outcome: 'FAIL',
            summary: 'SITE_MIXED_OR_HTTP',
            impact: 7,
            confidence: 1,
            effort: 5,
            action: 'Serve all crawled pages over HTTPS.',
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-009',
          category: 'http',
          evidenceId: page.evidenceId,
          outcome: 'PASS',
          summary: 'SITE_ALL_HTTPS',
          impact: 7,
          confidence: 1,
          effort: 1,
          action: 'All crawled pages use HTTPS.',
        },
      ];
    },
  },
  {
    id: 'SEO-SITE-010',
    category: 'headings',
    scope: 'site',
    evaluateSite: (ctx) => {
      const page = ctx.pages[0];
      if (page === undefined) return [];
      const missingH1 = ctx.pages.filter(
        (entry) => entry.headings.filter((heading) => heading.level === 1).length === 0,
      ).length;
      if (missingH1 === 0) {
        return [
          {
            ruleId: 'SEO-SITE-010',
            category: 'headings',
            evidenceId: page.evidenceId,
            outcome: 'PASS',
            summary: 'SITE_H1_COMPLETE',
            impact: 6,
            confidence: 0.95,
            effort: 1,
            action: 'All pages include an H1.',
          },
        ];
      }
      return [
        {
          ruleId: 'SEO-SITE-010',
          category: 'headings',
          evidenceId: page.evidenceId,
          outcome: 'WARN',
          summary: 'SITE_SOME_MISSING_H1',
          impact: 6,
          confidence: 0.95,
          effort: 3,
          action: `Add H1 headings on ${missingH1} page(s).`,
        },
      ];
    },
  },
];
