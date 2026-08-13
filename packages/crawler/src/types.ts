export interface CrawlerSettings {
  maxPages: number;
  maxDepth: number;
  concurrency: number;
  navigationTimeoutMs: number;
  /** Dev/test only. Never enable in production crawls of untrusted URLs. */
  allowLocalhost?: boolean;
}

export interface ExtractedImage {
  src: string;
  alt: string | null;
}

export interface ExtractedLink {
  href: string;
  text: string;
}

export interface ExtractedHeading {
  level: number;
  text: string;
}

export interface PageExtraction {
  url: string;
  finalUrl: string;
  statusCode: number | null;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  viewport: string | null;
  language: string | null;
  headings: ExtractedHeading[];
  links: ExtractedLink[];
  images: ExtractedImage[];
  openGraph: Record<string, string>;
}

export interface CrawlResult {
  seedUrl: string;
  pages: PageExtraction[];
}
