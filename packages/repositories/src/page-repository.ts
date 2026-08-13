import {
  evidence,
  pageHeadings,
  pageImages,
  pageLinks,
  pages,
  type Database,
} from '@lso/database';
import type { PageEvidenceWrite, PageRepository } from '@lso/domain';

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
}
