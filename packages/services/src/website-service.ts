import type {
  UpdateWebsiteInput,
  Website,
  WebsiteRepository,
} from '@lso/domain';
import { NotFoundError } from './errors.js';

export class WebsiteService {
  public constructor(private readonly websites: WebsiteRepository) {}

  public create(input: { businessId: string; url: string }): Promise<Website> {
    return this.websites.create(input);
  }

  public listByBusiness(businessId: string): Promise<Website[]> {
    return this.websites.listByBusiness(businessId);
  }

  public async getById(id: string): Promise<Website> {
    const website = await this.websites.findById(id);
    if (website === null) {
      throw new NotFoundError(`Website not found: ${id}`);
    }
    return website;
  }

  public async update(id: string, input: UpdateWebsiteInput): Promise<Website> {
    await this.getById(id);
    return this.websites.update(id, input);
  }

  public async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.websites.delete(id);
  }
}
