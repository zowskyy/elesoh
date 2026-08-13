import { crawls, type Database } from '@lso/database';
import type { Crawl, CrawlRepository } from '@lso/domain';
import { eq } from 'drizzle-orm';

function mapCrawl(row: typeof crawls.$inferSelect): Crawl {
  return {
    id: row.id,
    websiteId: row.websiteId,
    status: row.status,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCrawlRepository implements CrawlRepository {
  public constructor(private readonly db: Database) {}

  public async create(websiteId: string): Promise<Crawl> {
    const rows = await this.db
      .insert(crawls)
      .values({ websiteId, status: 'queued' })
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error('Failed to create crawl');
    }
    return mapCrawl(row);
  }

  public async findById(id: string): Promise<Crawl | null> {
    const rows = await this.db.select().from(crawls).where(eq(crawls.id, id)).limit(1);
    const row = rows[0];
    return row === undefined ? null : mapCrawl(row);
  }

  public async markRunning(id: string): Promise<Crawl> {
    const rows = await this.db
      .update(crawls)
      .set({ status: 'running', startedAt: new Date(), updatedAt: new Date() })
      .where(eq(crawls.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Crawl not found: ${id}`);
    }
    return mapCrawl(row);
  }

  public async markCompleted(id: string): Promise<Crawl> {
    const rows = await this.db
      .update(crawls)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(crawls.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Crawl not found: ${id}`);
    }
    return mapCrawl(row);
  }

  public async markFailed(id: string): Promise<Crawl> {
    const rows = await this.db
      .update(crawls)
      .set({ status: 'failed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(crawls.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Crawl not found: ${id}`);
    }
    return mapCrawl(row);
  }
}
