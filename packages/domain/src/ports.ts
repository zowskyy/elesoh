import type {
  Business,
  CreateBusinessInput,
  CreateJobInput,
  CreateWebsiteInput,
  Job,
  UpdateBusinessInput,
  UpdateWebsiteInput,
  Website,
} from './entities.js';

export interface BusinessRepository {
  create(input: CreateBusinessInput): Promise<Business>;
  findById(id: string): Promise<Business | null>;
  listByOrganization(organizationId: string): Promise<Business[]>;
  update(id: string, input: UpdateBusinessInput): Promise<Business>;
  delete(id: string): Promise<void>;
}

export interface WebsiteRepository {
  create(input: CreateWebsiteInput): Promise<Website>;
  findById(id: string): Promise<Website | null>;
  listByBusiness(businessId: string): Promise<Website[]>;
  update(id: string, input: UpdateWebsiteInput): Promise<Website>;
  delete(id: string): Promise<void>;
}

export interface JobRepository {
  findByIdempotencyKey(key: string): Promise<Job | null>;
  create(input: CreateJobInput): Promise<Job>;
}
