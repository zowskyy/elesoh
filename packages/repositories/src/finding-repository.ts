import { findings, type Database } from '@lso/database';
import type { Finding, FindingRepository } from '@lso/domain';
import type { FindingWrite } from '@lso/domain';
import { eq } from 'drizzle-orm';

function mapFinding(row: typeof findings.$inferSelect): Finding {
  return {
    id: row.id,
    auditRunId: row.auditRunId,
    evidenceId: row.evidenceId,
    ruleId: row.ruleId,
    outcome: row.outcome as Finding['outcome'],
    summary: row.summary,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleFindingRepository implements FindingRepository {
  public constructor(private readonly db: Database) {}

  public async insertMany(rows: FindingWrite[]): Promise<Finding[]> {
    if (rows.length === 0) {
      return [];
    }
    const inserted = await this.db
      .insert(findings)
      .values(
        rows.map((row) => ({
          auditRunId: row.auditRunId,
          evidenceId: row.evidenceId,
          ruleId: row.ruleId,
          outcome: row.outcome,
          summary: row.summary,
        })),
      )
      .returning();
    return inserted.map(mapFinding);
  }

  public async listByAudit(auditRunId: string): Promise<Finding[]> {
    const rows = await this.db.select().from(findings).where(eq(findings.auditRunId, auditRunId));
    return rows.map(mapFinding);
  }
}
