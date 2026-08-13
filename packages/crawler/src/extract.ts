import type { Page } from 'playwright';
import type { PageExtraction } from './types.js';

const EXTRACT_SCRIPT = `(() => {
  const meta = (name) => {
    const byName = document.querySelector('meta[name="' + name + '"]');
    if (byName) return byName.content || null;
    const byProperty = document.querySelector('meta[property="' + name + '"]');
    if (byProperty) return byProperty.content || null;
    return null;
  };

  const headings = Array.from(document.querySelectorAll('h1,h2,h3')).map((el) => ({
    level: Number.parseInt(el.tagName.slice(1), 10),
    text: (el.textContent || '').trim(),
  }));

  const links = Array.from(document.querySelectorAll('a[href]')).map((el) => ({
    href: el.href,
    text: (el.textContent || '').trim().slice(0, 200),
  }));

  const images = Array.from(document.querySelectorAll('img')).map((el) => ({
    src: el.currentSrc || el.src,
    alt: el.alt || null,
  }));

  const openGraph = {};
  Array.from(document.querySelectorAll('meta[property^="og:"]')).forEach((el) => {
    if (el.content) openGraph[el.getAttribute('property') || ''] = el.content;
  });

  const canonical = document.querySelector('link[rel="canonical"]');

  return {
    title: document.title || null,
    description: meta('description'),
    canonical: canonical ? canonical.href : null,
    robotsMeta: meta('robots'),
    viewport: meta('viewport'),
    language: document.documentElement.getAttribute('lang'),
    headings,
    links,
    images,
    openGraph,
  };
})()`;

export async function extractPage(page: Page, requestedUrl: string): Promise<PageExtraction> {
  const finalUrl = page.url();
  const data = (await page.evaluate(EXTRACT_SCRIPT)) as Omit<
    PageExtraction,
    'url' | 'finalUrl' | 'statusCode'
  >;

  return {
    url: requestedUrl,
    finalUrl,
    statusCode: null,
    ...data,
  };
}
