import type { ExtractedHeading, ExtractedImage, ExtractedLink, PageExtraction } from './types.js';

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function metaContent(html: string, name: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${name}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1] !== undefined) {
      return decodeEntities(match[1]);
    }
  }
  return null;
}

function linkHref(html: string, rel: string): string | null {
  const match = html.match(
    new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, 'i'),
  );
  return match?.[1] ?? null;
}

export function extractHtmlPage(html: string, requestedUrl: string, finalUrl: string, statusCode: number | null): PageExtraction {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);

  const headings: ExtractedHeading[] = [];
  const headingPattern = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingPattern.exec(html)) !== null) {
    const tag = headingMatch[1];
    const level = tag !== undefined ? Number.parseInt(tag.slice(1), 10) : 0;
    const text = decodeEntities(headingMatch[2]?.replace(/<[^>]+>/g, '') ?? '');
    if (text) headings.push({ level, text });
  }

  const links: ExtractedLink[] = [];
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkPattern.exec(html)) !== null) {
    const href = linkMatch[1];
    if (href === undefined || href.startsWith('#') || href.startsWith('javascript:')) continue;
    try {
      const absolute = new URL(href, finalUrl).toString();
      links.push({
        href: absolute,
        text: decodeEntities(linkMatch[2]?.replace(/<[^>]+>/g, '').slice(0, 200) ?? ''),
      });
    } catch {
      continue;
    }
  }

  const images: ExtractedImage[] = [];
  const imagePattern = /<img[^>]+>/gi;
  let imageMatch: RegExpExecArray | null;
  while ((imageMatch = imagePattern.exec(html)) !== null) {
    const tag = imageMatch[0];
    const srcMatch = tag.match(/\ssrc=["']([^"']+)["']/i);
    const altMatch = tag.match(/\salt=["']([^"']*)["']/i);
    if (srcMatch?.[1] !== undefined) {
      try {
        images.push({
          src: new URL(srcMatch[1], finalUrl).toString(),
          alt: altMatch?.[1] ?? null,
        });
      } catch {
        continue;
      }
    }
  }

  const openGraph: Record<string, string> = {};
  const ogPattern = /<meta[^>]+property=["'](og:[^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi;
  let ogMatch: RegExpExecArray | null;
  while ((ogMatch = ogPattern.exec(html)) !== null) {
    const key = ogMatch[1];
    const value = ogMatch[2];
    if (key !== undefined && value !== undefined) {
      openGraph[key] = decodeEntities(value);
    }
  }

  return {
    url: requestedUrl,
    finalUrl,
    statusCode,
    title: titleMatch?.[1] !== undefined ? decodeEntities(titleMatch[1].replace(/<[^>]+>/g, '')) : null,
    description: metaContent(html, 'description'),
    canonical: linkHref(html, 'canonical'),
    robotsMeta: metaContent(html, 'robots'),
    viewport: metaContent(html, 'viewport'),
    language: langMatch?.[1] ?? null,
    headings,
    links,
    images,
    openGraph,
  };
}
