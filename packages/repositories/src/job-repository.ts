import { jobs, type Database } from '@lso/database';
import type { CreateJobInput, Job, JobRepository, JobStatus, JobType } from '@lso/domain';
import { eq } from 'drizzle-orm';

function mapJob(row: typeof jobs.$inferSelect): Job {
  return {
    id: row.id,
    type: row.type as JobType,
    status: row.status as JobStatus,
    idempotencyKey: row.idempotencyKey,
    payload: row.payload,
    attempts: row.attempts,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    error: row.error,
  };
}

export class DrizzleJobRepository implements JobRepository {
  public constructor(private readonly db: Database) {}

  public async findByIdempotencyKey(key: string): Promise<Job | null> {
    const rows = await this.db.select().from(jobs).where(eq(jobs.idempotencyKey, key)).limit(1);
    const row = rows[0];
    return row === undefined ? null : mapJob(row);
  }

  public async create(input: CreateJobInput): Promise<Job> {
    const rows = await this.db
      .insert(jobs)
      .values({
        type: input.type,
        status: 'QUEUED',
        idempotencyKey: input.idempotencyKey,
        payload: input.payload,
        attempts: 0,
      })
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error('Failed to create job');
    }
    return mapJob(row);
  }
}
