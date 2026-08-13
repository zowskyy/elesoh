import { businesses, type Database } from '@lso/database';
import type {
  Business,
  BusinessRepository,
  CreateBusinessInput,
  UpdateBusinessInput,
} from '@lso/domain';
import { eq } from 'drizzle-orm';

function mapBusiness(row: typeof businesses.$inferSelect): Business {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    category: row.category,
    phone: row.phone,
    websiteUrl: row.websiteUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleBusinessRepository implements BusinessRepository {
  public constructor(private readonly db: Database) {}

  public async create(input: CreateBusinessInput): Promise<Business> {
    const rows = await this.db.insert(businesses).values(input).returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error('Failed to create business');
    }
    return mapBusiness(row);
  }

  public async findById(id: string): Promise<Business | null> {
    const rows = await this.db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    const row = rows[0];
    return row === undefined ? null : mapBusiness(row);
  }

  public async listByOrganization(organizationId: string): Promise<Business[]> {
    const rows = await this.db
      .select()
      .from(businesses)
      .where(eq(businesses.organizationId, organizationId));
    return rows.map(mapBusiness);
  }

  public async findByWebsiteUrl(
    organizationId: string,
    websiteUrl: string,
  ): Promise<Business | null> {
    const rows = await this.db
      .select()
      .from(businesses)
      .where(eq(businesses.organizationId, organizationId));
    const normalized = websiteUrl.toLowerCase().replace(/\/$/, '');
    const row = rows.find((entry) => {
      if (entry.websiteUrl === null) return false;
      return entry.websiteUrl.toLowerCase().replace(/\/$/, '') === normalized;
    });
    return row === undefined ? null : mapBusiness(row);
  }

  public async findByName(organizationId: string, name: string): Promise<Business | null> {
    const rows = await this.db
      .select()
      .from(businesses)
      .where(eq(businesses.organizationId, organizationId));
    const key = name.trim().toLowerCase();
    const row = rows.find((entry) => entry.name.trim().toLowerCase() === key);
    return row === undefined ? null : mapBusiness(row);
  }

  public async update(id: string, input: UpdateBusinessInput): Promise<Business> {
    const rows = await this.db
      .update(businesses)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Business not found: ${id}`);
    }
    return mapBusiness(row);
  }

  public async delete(id: string): Promise<void> {
    await this.db.delete(businesses).where(eq(businesses.id, id));
  }
}
