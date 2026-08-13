import { findings, recommendations, type Database } from '@lso/database';
import type { Recommendation, RecommendationRepository } from '@lso/domain';
import type { RecommendationWrite } from '@lso/domain';
import { eq, inArray } from 'drizzle-orm';

function mapRecommendation(row: typeof recommendations.$inferSelect): Recommendation {
  return {
    id: row.id,
    findingId: row.findingId,
    priority: row.priority,
    action: row.action,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleRecommendationRepository implements RecommendationRepository {
  public constructor(private readonly db: Database) {}

  public async insertMany(rows: RecommendationWrite[]): Promise<Recommendation[]> {
    if (rows.length === 0) {
      return [];
    }
    const inserted = await this.db
      .insert(recommendations)
      .values(
        rows.map((row) => ({
          findingId: row.findingId,
          priority: row.priority,
          action: row.action,
        })),
      )
      .returning();
    return inserted.map(mapRecommendation);
  }

  public async listByAudit(auditRunId: string): Promise<Recommendation[]> {
    const findingRows = await this.db
      .select({ id: findings.id })
      .from(findings)
      .where(eq(findings.auditRunId, auditRunId));
    const ids = findingRows.map((row) => row.id);
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(recommendations)
      .where(inArray(recommendations.findingId, ids));
    return rows.map(mapRecommendation);
  }
}
