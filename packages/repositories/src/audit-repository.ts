import { auditRuns, type Database } from '@lso/database';
import type { AuditRepository, AuditRun } from '@lso/domain';
import { eq } from 'drizzle-orm';

function mapAudit(row: typeof auditRuns.$inferSelect): AuditRun {
  return {
    id: row.id,
    websiteId: row.websiteId,
    crawlId: row.crawlId,
    mode: row.mode === 'full' ? 'full' : 'seo',
    status: row.status,
    version: row.version,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleAuditRepository implements AuditRepository {
  public constructor(private readonly db: Database) {}

  public async create(input: {
    websiteId: string;
    crawlId: string | null;
    mode: 'seo' | 'full';
    version: string;
  }): Promise<AuditRun> {
    const rows = await this.db
      .insert(auditRuns)
      .values({
        websiteId: input.websiteId,
        crawlId: input.crawlId,
        mode: input.mode,
        status: 'queued',
        version: input.version,
      })
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error('Failed to create audit run');
    }
    return mapAudit(row);
  }

  public async findById(id: string): Promise<AuditRun | null> {
    const rows = await this.db.select().from(auditRuns).where(eq(auditRuns.id, id)).limit(1);
    const row = rows[0];
    return row === undefined ? null : mapAudit(row);
  }

  public async markRunning(id: string): Promise<AuditRun> {
    const rows = await this.db
      .update(auditRuns)
      .set({ status: 'running', startedAt: new Date(), updatedAt: new Date() })
      .where(eq(auditRuns.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Audit not found: ${id}`);
    }
    return mapAudit(row);
  }

  public async markCompleted(id: string): Promise<AuditRun> {
    const rows = await this.db
      .update(auditRuns)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(auditRuns.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Audit not found: ${id}`);
    }
    return mapAudit(row);
  }

  public async markFailed(id: string): Promise<AuditRun> {
    const rows = await this.db
      .update(auditRuns)
      .set({ status: 'failed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(auditRuns.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Audit not found: ${id}`);
    }
    return mapAudit(row);
  }
}
