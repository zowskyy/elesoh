import { jobs, type Database } from '@lso/database';
import type { CreateJobInput, Job, JobRepository, JobStatus, JobType } from '@lso/domain';
import { eq, sql } from 'drizzle-orm';

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

  public async findById(id: string): Promise<Job | null> {
    const rows = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    const row = rows[0];
    return row === undefined ? null : mapJob(row);
  }

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

  public async markRunning(id: string): Promise<Job> {
    const rows = await this.db
      .update(jobs)
      .set({
        status: 'RUNNING',
        startedAt: new Date(),
        attempts: sql`${jobs.attempts} + 1`,
      })
      .where(eq(jobs.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Job not found: ${id}`);
    }
    return mapJob(row);
  }

  public async markCompleted(id: string): Promise<Job> {
    const rows = await this.db
      .update(jobs)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        error: null,
      })
      .where(eq(jobs.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Job not found: ${id}`);
    }
    return mapJob(row);
  }

  public async markFailed(id: string, error: string): Promise<Job> {
    const rows = await this.db
      .update(jobs)
      .set({
        status: 'FAILED',
        completedAt: new Date(),
        error,
      })
      .where(eq(jobs.id, id))
      .returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error(`Job not found: ${id}`);
    }
    return mapJob(row);
  }
}
