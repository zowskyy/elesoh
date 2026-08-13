import { providerRuns, type Database } from '@lso/database';
import type { ProviderRun, ProviderRunRepository } from '@lso/domain';
import { eq } from 'drizzle-orm';

export class DrizzleProviderRunRepository implements ProviderRunRepository {
  public constructor(private readonly db: Database) {}

  public async create(input: {
    provider: string;
    status: string;
    payload?: Record<string, unknown>;
    organizationId?: string;
  }): Promise<ProviderRun> {
    const rows = await this.db
      .insert(providerRuns)
      .values({
        provider: input.provider,
        status: input.status,
        payload: input.payload ?? {},
        organizationId: input.organizationId ?? null,
      })
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error('Failed to create provider run');
    }
    return map(row);
  }

  public async findById(id: string): Promise<ProviderRun | null> {
    const rows = await this.db.select().from(providerRuns).where(eq(providerRuns.id, id)).limit(1);
    const row = rows[0];
    return row === undefined ? null : map(row);
  }

  public async markRunning(id: string): Promise<ProviderRun> {
    const rows = await this.db
      .update(providerRuns)
      .set({ status: 'running', startedAt: new Date(), updatedAt: new Date() })
      .where(eq(providerRuns.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Provider run not found: ${id}`);
    }
    return map(row);
  }

  public async markCompleted(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<ProviderRun> {
    const rows = await this.db
      .update(providerRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
        payload,
      })
      .where(eq(providerRuns.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Provider run not found: ${id}`);
    }
    return map(row);
  }

  public async markFailed(id: string, error: string): Promise<ProviderRun> {
    const rows = await this.db
      .update(providerRuns)
      .set({
        status: 'failed',
        completedAt: new Date(),
        updatedAt: new Date(),
        payload: { error },
      })
      .where(eq(providerRuns.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Provider run not found: ${id}`);
    }
    return map(row);
  }
}

function map(row: typeof providerRuns.$inferSelect): ProviderRun {
  return {
    id: row.id,
    provider: row.provider,
    status: row.status,
    payload: row.payload ?? null,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    organizationId: row.organizationId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
