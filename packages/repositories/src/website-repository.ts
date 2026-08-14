import { websites, type Database } from '@lso/database';
import type {
  CreateWebsiteInput,
  UpdateWebsiteInput,
  Website,
  WebsiteRepository,
} from '@lso/domain';
import { eq } from 'drizzle-orm';

function mapWebsite(row: typeof websites.$inferSelect): Website {
  return {
    id: row.id,
    businessId: row.businessId,
    url: row.url,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleWebsiteRepository implements WebsiteRepository {
  public constructor(private readonly db: Database) {}

  public async create(input: CreateWebsiteInput): Promise<Website> {
    const rows = await this.db.insert(websites).values(input).returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error('Failed to create website');
    }
    return mapWebsite(row);
  }

  public async findById(id: string): Promise<Website | null> {
    const rows = await this.db.select().from(websites).where(eq(websites.id, id)).limit(1);
    const row = rows[0];
    return row === undefined ? null : mapWebsite(row);
  }

  public async findByUrl(url: string): Promise<Website | null> {
    const rows = await this.db.select().from(websites).where(eq(websites.url, url)).limit(1);
    const row = rows[0];
    return row === undefined ? null : mapWebsite(row);
  }

  public async listByBusiness(businessId: string): Promise<Website[]> {
    const rows = await this.db.select().from(websites).where(eq(websites.businessId, businessId));
    return rows.map(mapWebsite);
  }

  public async update(id: string, input: UpdateWebsiteInput): Promise<Website> {
    const rows = await this.db
      .update(websites)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(websites.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Website not found: ${id}`);
    }
    return mapWebsite(row);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(websites).where(eq(websites.id, id));
  }
}
