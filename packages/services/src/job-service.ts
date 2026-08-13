import type { CreateJobInput, Job, JobRepository } from '@lso/domain';

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const code = 'code' in error ? error.code : undefined;
  return code === '23505';
}

export class JobService {
  public constructor(private readonly jobs: JobRepository) {}

  public async createIfAbsent(input: CreateJobInput): Promise<{ job: Job; created: boolean }> {
    const existing = await this.jobs.findByIdempotencyKey(input.idempotencyKey);
    if (existing !== null) {
      return { job: existing, created: false };
    }

    try {
      const job = await this.jobs.create(input);
      return { job, created: true };
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      const raced = await this.jobs.findByIdempotencyKey(input.idempotencyKey);
      if (raced === null) {
        throw error;
      }
      return { job: raced, created: false };
    }
  }
}
