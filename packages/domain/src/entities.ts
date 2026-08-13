export const DEFAULT_ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  organizationId: string;
  name: string;
  category: string | null;
  phone: string | null;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBusinessInput {
  organizationId: string;
  name: string;
  category: string | null;
  phone: string | null;
  websiteUrl: string | null;
}

export interface UpdateBusinessInput {
  name?: string;
  category?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
}

export interface BusinessLocation {
  id: string;
  businessId: string;
  address: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Website {
  id: string;
  businessId: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebsiteInput {
  businessId: string;
  url: string;
}

export interface UpdateWebsiteInput {
  url?: string;
}

export interface Crawl {
  id: string;
  websiteId: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Page {
  id: string;
  crawlId: string;
  url: string;
  statusCode: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type FindingOutcome = 'PASS' | 'WARN' | 'FAIL' | 'NOT_APPLICABLE' | 'ERROR';

/**
 * Raw observation. Example: `{ title: null }`.
 * Evidence is not a finding.
 */
export interface Evidence {
  id: string;
  pageId: string;
  kind: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rule evaluation against evidence. Example: `TITLE_MISSING = fail`.
 * Finding is not evidence.
 */
export interface Finding {
  id: string;
  auditRunId: string;
  evidenceId: string;
  ruleId: string;
  outcome: FindingOutcome;
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recommendation {
  id: string;
  findingId: string;
  priority: string;
  action: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditRun {
  id: string;
  websiteId: string;
  status: string;
  version: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  auditRunId: string;
  format: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type JobType =
  | 'DISCOVER_BUSINESSES'
  | 'VERIFY_WEBSITE'
  | 'CRAWL_WEBSITE'
  | 'RUN_SEO_AUDIT'
  | 'RUN_PERFORMANCE_AUDIT'
  | 'RUN_FULL_AUDIT'
  | 'GENERATE_AI_REPORT'
  | 'GENERATE_PDF';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  idempotencyKey: string | null;
  payload: Record<string, unknown>;
  attempts: number;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
}

export interface CreateJobInput {
  type: JobType;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}

export interface Provider {
  id: string;
  name: string;
  kind: string;
}
