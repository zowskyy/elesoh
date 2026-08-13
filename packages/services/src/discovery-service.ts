import type { Env } from '@lso/config';
import {
  discover,
  normalizeName,
  verifyWebsite,
  type DiscoverQuery,
} from '@lso/discovery';
import {
  DEFAULT_ORGANIZATION_ID,
  type BusinessRepository,
  type Job,
  type JobRepository,
  type OpportunityRepository,
  type OpportunityRow,
  type ProviderRunRepository,
  type WebsiteRepository,
} from '@lso/domain';
import type { Queue } from 'bullmq';
import { NotFoundError } from './errors.js';
import { JobService } from './job-service.js';

export const DISCOVERY_QUEUE_NAME = 'discovery';
export const DISCOVER_JOB_NAME = 'DISCOVER_BUSINESSES';
export const VERIFY_WEBSITE_JOB_NAME = 'VERIFY_WEBSITE';

export class DiscoveryService {
  public constructor(
    private readonly businesses: BusinessRepository,
    private readonly websites: WebsiteRepository,
    private readonly opportunities: OpportunityRepository,
    private readonly providerRuns: ProviderRunRepository,
    private readonly jobs: JobRepository,
    private readonly jobService: JobService,
    private readonly queue: Queue,
    private readonly env: Env,
  ) {}

  public async enqueueDiscover(
    query: DiscoverQuery,
    idempotencyKey?: string,
  ): Promise<{ job: Job; providerRunId: string; created: boolean }> {
    const provider = query.provider;
    const key =
      idempotencyKey ??
      `discover:${provider}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

    const existing = await this.jobs.findByIdempotencyKey(key);
    if (existing !== null) {
      const providerRunId = existing.payload['providerRunId'];
      if (typeof providerRunId === 'string') {
        return { job: existing, providerRunId, created: false };
      }
    }

    const run = await this.providerRuns.create({
      provider,
      status: 'queued',
      organizationId: DEFAULT_ORGANIZATION_ID,
      payload: { query },
    });

    const { job, created } = await this.jobService.createIfAbsent({
      type: 'DISCOVER_BUSINESSES',
      idempotencyKey: key,
      payload: {
        providerRunId: run.id,
        query,
      },
    });

    if (created) {
      await this.queue.add(
        DISCOVER_JOB_NAME,
        {
          jobId: job.id,
          providerRunId: run.id,
          query,
        },
        {
          jobId: job.id,
          attempts: 2,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    }

    return { job, providerRunId: run.id, created };
  }

  public async getProviderRun(id: string) {
    const run = await this.providerRuns.findById(id);
    if (run === null) {
      throw new NotFoundError(`Provider run not found: ${id}`);
    }
    return run;
  }

  public listOpportunities(): Promise<OpportunityRow[]> {
    return this.opportunities.listByOrganization(DEFAULT_ORGANIZATION_ID);
  }

  public async executeDiscoverJob(input: {
    jobId: string;
    providerRunId: string;
    query: DiscoverQuery;
  }): Promise<{ created: number; skipped: number; verified: number }> {
    await this.jobs.markRunning(input.jobId);
    await this.providerRuns.markRunning(input.providerRunId);

    try {
      const candidates = await discover(input.query);
      let created = 0;
      let skipped = 0;
      let verified = 0;
      const createdIds: string[] = [];

      for (const candidate of candidates) {
        if (candidate.websiteUrl !== null) {
          const existingSite = await this.businesses.findByWebsiteUrl(
            DEFAULT_ORGANIZATION_ID,
            candidate.websiteUrl,
          );
          if (existingSite !== null) {
            skipped += 1;
            continue;
          }
        } else {
          const existingName = await this.businesses.findByName(
            DEFAULT_ORGANIZATION_ID,
            candidate.name,
          );
          if (
            existingName !== null &&
            normalizeName(existingName.name) === normalizeName(candidate.name)
          ) {
            skipped += 1;
            continue;
          }
        }

        const business = await this.businesses.create({
          organizationId: DEFAULT_ORGANIZATION_ID,
          name: candidate.name,
          category: candidate.category,
          phone: candidate.phone,
          websiteUrl: candidate.websiteUrl,
        });
        created += 1;
        createdIds.push(business.id);

        await this.opportunities.createLocation({
          businessId: business.id,
          address: candidate.address,
          city: candidate.city,
          region: candidate.region,
          postalCode: candidate.postalCode,
          country: candidate.country,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        });

        if (candidate.websiteUrl !== null) {
          await this.websites.create({
            businessId: business.id,
            url: candidate.websiteUrl,
          });
          const check = await verifyWebsite(candidate.websiteUrl, {
            allowLocalhost: this.env.CRAWLER_ALLOW_LOCALHOST,
          });
          if (check.ok) {
            verified += 1;
          }
        }
      }

      await this.providerRuns.markCompleted(input.providerRunId, {
        query: input.query,
        created,
        skipped,
        verified,
        businessIds: createdIds,
        candidateCount: candidates.length,
      });
      await this.jobs.markCompleted(input.jobId);
      return { created, skipped, verified };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'discovery failed';
      await this.providerRuns.markFailed(input.providerRunId, message);
      await this.jobs.markFailed(input.jobId, message);
      throw error;
    }
  }
}
