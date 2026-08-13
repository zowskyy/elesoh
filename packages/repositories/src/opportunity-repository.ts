import {
  auditRuns,
  auditScores,
  businessLocations,
  businesses,
  websites,
  type Database,
} from '@lso/database';
import type { BusinessLocation, OpportunityRepository, OpportunityRow } from '@lso/domain';
import { computeOpportunityScore } from '@lso/discovery';
import { desc, eq } from 'drizzle-orm';

export class DrizzleOpportunityRepository implements OpportunityRepository {
  public constructor(private readonly db: Database) {}

  public async listByOrganization(organizationId: string): Promise<OpportunityRow[]> {
    const businessRows = await this.db
      .select()
      .from(businesses)
      .where(eq(businesses.organizationId, organizationId));

    const out: OpportunityRow[] = [];
    for (const business of businessRows) {
      const siteRows = await this.db
        .select()
        .from(websites)
        .where(eq(websites.businessId, business.id))
        .limit(1);
      const website = siteRows[0];
      const websiteUrl = business.websiteUrl ?? website?.url ?? null;

      let auditOverall: number | null = null;
      if (website !== undefined) {
        const auditRows = await this.db
          .select({ overall: auditScores.overall })
          .from(auditRuns)
          .innerJoin(auditScores, eq(auditScores.auditRunId, auditRuns.id))
          .where(eq(auditRuns.websiteId, website.id))
          .orderBy(desc(auditRuns.completedAt))
          .limit(1);
        auditOverall = auditRows[0]?.overall ?? null;
      }

      const scored = computeOpportunityScore({
        websiteUrl,
        auditOverall,
      });
      out.push({
        businessId: business.id,
        name: business.name,
        websiteUrl,
        opportunityScore: scored.score,
        auditScore: auditOverall,
        reason: scored.reason,
      });
    }

    return out.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  public async createLocation(input: {
    businessId: string;
    address: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
  }): Promise<BusinessLocation> {
    const rows = await this.db.insert(businessLocations).values(input).returning();
    const row = rows[0];
    if (row === undefined) {
      throw new Error('Failed to create business location');
    }
    return {
      id: row.id,
      businessId: row.businessId,
      address: row.address,
      city: row.city,
      region: row.region,
      postalCode: row.postalCode,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
