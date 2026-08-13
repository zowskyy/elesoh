import {
  evidence,
  pageHeadings,
  pageImages,
  pageLinks,
  pages,
  type Database,
} from '@lso/database';
import type { CrawlPageSnapshot, PageEvidenceWrite, PageRepository } from '@lso/domain';
import { eq, inArray } from 'drizzle-orm';

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asOpenGraph(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      out[key] = entry;
    }
  }
  return out;
}

export class DrizzlePageRepository implements PageRepository {
  public constructor(private readonly db: Database) {}

  public async insertExtractedPages(crawlId: string, extracted: PageEvidenceWrite[]): Promise<number> {
    let count = 0;
    for (const page of extracted) {
      const inserted = await this.db
        .insert(pages)
        .values({
          crawlId,
          url: page.url,
          statusCode: page.statusCode,
        })
        .returning({ id: pages.id });
      const pageId = inserted[0]?.id;
      if (pageId === undefined) {
        continue;
      }
      count += 1;

      await this.db.insert(evidence).values({
        pageId,
        kind: 'page.seo',
        data: page.evidence,
      });

      if (page.headings.length > 0) {
        await this.db.insert(pageHeadings).values(
          page.headings.map((heading) => ({
            pageId,
            level: heading.level,
            text: heading.text,
          })),
        );
      }
      if (page.links.length > 0) {
        await this.db.insert(pageLinks).values(
          page.links.slice(0, 500).map((link) => ({
            pageId,
            href: link.href,
          })),
        );
      }
      if (page.images.length > 0) {
        await this.db.insert(pageImages).values(
          page.images.slice(0, 500).map((image) => ({
            pageId,
            src: image.src,
            alt: image.alt,
          })),
        );
      }
    }
    return count;
  }

  public async listSnapshotsByCrawl(crawlId: string): Promise<CrawlPageSnapshot[]> {
    const pageRows = await this.db.select().from(pages).where(eq(pages.crawlId, crawlId));
    if (pageRows.length === 0) {
      return [];
    }
    const pageIds = pageRows.map((row) => row.id);
    const evidenceRows = await this.db
      .select()
      .from(evidence)
      .where(inArray(evidence.pageId, pageIds));
    const headingRows = await this.db
      .select()
      .from(pageHeadings)
      .where(inArray(pageHeadings.pageId, pageIds));
    const linkRows = await this.db.select().from(pageLinks).where(inArray(pageLinks.pageId, pageIds));
    const imageRows = await this.db
      .select()
      .from(pageImages)
      .where(inArray(pageImages.pageId, pageIds));

    const evidenceByPage = new Map<string, (typeof evidenceRows)[number]>();
    for (const row of evidenceRows) {
      if (row.kind === 'page.seo' && !evidenceByPage.has(row.pageId)) {
        evidenceByPage.set(row.pageId, row);
      }
    }

    return pageRows.flatMap((page) => {
      const seoEvidence = evidenceByPage.get(page.id);
      if (seoEvidence === undefined) {
        return [];
      }
      const data = seoEvidence.data;
      return [
        {
          pageId: page.id,
          url: page.url,
          statusCode: page.statusCode,
          evidenceId: seoEvidence.id,
          seo: {
            title: asString(data['title']),
            description: asString(data['description']),
            canonical: asString(data['canonical']),
            robotsMeta: asString(data['robotsMeta']),
            viewport: asString(data['viewport']),
            language: asString(data['language']),
            openGraph: asOpenGraph(data['openGraph']),
            ...(typeof data['requestedUrl'] === 'string'
              ? { requestedUrl: data['requestedUrl'] }
              : {}),
          },
          headings: headingRows
            .filter((row) => row.pageId === page.id)
            .map((row) => ({ level: row.level, text: row.text })),
          links: linkRows
            .filter((row) => row.pageId === page.id)
            .map((row) => ({ href: row.href })),
          images: imageRows
            .filter((row) => row.pageId === page.id)
            .map((row) => ({ src: row.src, alt: row.alt })),
        },
      ];
    });
  }
}
