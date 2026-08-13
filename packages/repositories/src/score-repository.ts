import { auditScores, type Database } from '@lso/database';
import type { AuditScore, ScoreRepository } from '@lso/domain';
import { eq } from 'drizzle-orm';

function mapScore(row: typeof auditScores.$inferSelect): AuditScore {
  return {
    id: row.id,
    auditRunId: row.auditRunId,
    overall: row.overall,
    seo: row.seo,
    performance: row.performance,
    categories: row.categories,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleScoreRepository implements ScoreRepository {
  public constructor(private readonly db: Database) {}

  public async upsert(input: {
    auditRunId: string;
    overall: number;
    seo: number;
    performance: number | null;
    categories: Record<string, number>;
  }): Promise<AuditScore> {
    const existing = await this.findByAudit(input.auditRunId);
    if (existing !== null) {
      const rows = await this.db
        .update(auditScores)
        .set({
          overall: input.overall,
          seo: input.seo,
          performance: input.performance,
          categories: input.categories,
          updatedAt: new Date(),
        })
        .where(eq(auditScores.auditRunId, input.auditRunId))
        .returning();
      const row = rows[0];
      if (row === undefined) {
        throw new Error('Failed to update audit score');
      }
      return mapScore(row);
    }

    const rows = await this.db
      .insert(auditScores)
      .values({
        auditRunId: input.auditRunId,
        overall: input.overall,
        seo: input.seo,
        performance: input.performance,
        categories: input.categories,
      })
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error('Failed to insert audit score');
    }
    return mapScore(row);
  }

  public async findByAudit(auditRunId: string): Promise<AuditScore | null> {
    const rows = await this.db
      .select()
      .from(auditScores)
      .where(eq(auditScores.auditRunId, auditRunId))
      .limit(1);
    const row = rows[0];
    return row === undefined ? null : mapScore(row);
  }
}
