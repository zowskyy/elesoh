import { reports, type Database } from '@lso/database';
import type { Report, ReportRepository } from '@lso/domain';
import { eq } from 'drizzle-orm';

function mapReport(row: typeof reports.$inferSelect): Report {
  return {
    id: row.id,
    auditRunId: row.auditRunId,
    format: row.format,
    path: row.path,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleReportRepository implements ReportRepository {
  public constructor(private readonly db: Database) {}

  public async create(input: {
    auditRunId: string;
    format: string;
    path: string;
  }): Promise<Report> {
    const rows = await this.db
      .insert(reports)
      .values({
        auditRunId: input.auditRunId,
        format: input.format,
        path: input.path,
      })
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error('Failed to create report');
    }
    return mapReport(row);
  }

  public async findById(id: string): Promise<Report | null> {
    const rows = await this.db.select().from(reports).where(eq(reports.id, id)).limit(1);
    const row = rows[0];
    return row === undefined ? null : mapReport(row);
  }

  public async listByAudit(auditRunId: string): Promise<Report[]> {
    const rows = await this.db.select().from(reports).where(eq(reports.auditRunId, auditRunId));
    return rows.map(mapReport);
  }
}
