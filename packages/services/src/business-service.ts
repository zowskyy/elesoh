import {
  DEFAULT_ORGANIZATION_ID,
  type Business,
  type BusinessRepository,
  type UpdateBusinessInput,
} from '@lso/domain';
import { NotFoundError } from './errors.js';

export class BusinessService {
  public constructor(private readonly businesses: BusinessRepository) {}

  public create(input: {
    name: string;
    category?: string | null;
    phone?: string | null;
    websiteUrl?: string | null;
  }): Promise<Business> {
    return this.businesses.create({
      organizationId: DEFAULT_ORGANIZATION_ID,
      name: input.name,
      category: input.category ?? null,
      phone: input.phone ?? null,
      websiteUrl: input.websiteUrl ?? null,
    });
  }

  public list(): Promise<Business[]> {
    return this.businesses.listByOrganization(DEFAULT_ORGANIZATION_ID);
  }

  public findByWebsiteUrl(websiteUrl: string): Promise<Business | null> {
    return this.businesses.findByWebsiteUrl(DEFAULT_ORGANIZATION_ID, websiteUrl);
  }

  public async getById(id: string): Promise<Business> {
    const business = await this.businesses.findById(id);
    if (business === null) {
      throw new NotFoundError(`Business not found: ${id}`);
    }
    return business;
  }

  public async update(id: string, input: UpdateBusinessInput): Promise<Business> {
    await this.getById(id);
    return this.businesses.update(id, input);
  }

  public async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.businesses.delete(id);
  }
}
