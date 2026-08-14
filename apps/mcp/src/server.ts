import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { McpServices } from './services.js';

function text(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

export const PRODUCT_MCP_TOOL_NAMES = [
  'list_businesses',
  'get_business',
  'enqueue_crawl',
  'run_audit',
  'get_audit',
  'get_score',
  'list_findings',
  'list_opportunities',
  'get_job',
] as const;

export const FORBIDDEN_MCP_TOOL_NAMES = [
  'execute_sql',
  'fetch_any_url',
  'redis_get',
  'redis_set',
] as const;

export function createProductMcpServer(services: McpServices): McpServer {
  const server = new McpServer(
    {
      name: 'localsite-optimizer',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.registerTool(
    'list_businesses',
    {
      title: 'List businesses',
      description: 'List businesses stored in LocalSite Optimizer.',
    },
    async () => text(await services.businessService.list()),
  );

  server.registerTool(
    'get_business',
    {
      title: 'Get business',
      description: 'Fetch one business by id.',
      inputSchema: {
        id: z.string().uuid(),
      },
    },
    async ({ id }) => text(await services.businessService.getById(id)),
  );

  server.registerTool(
    'enqueue_crawl',
    {
      title: 'Enqueue crawl',
      description: 'Enqueue a website crawl job.',
      inputSchema: {
        websiteId: z.string().uuid(),
        idempotencyKey: z.string().min(1).max(200).optional(),
      },
    },
    async ({ websiteId, idempotencyKey }) =>
      text(
        await services.crawlService.enqueueCrawl(
          websiteId,
          idempotencyKey === undefined ? undefined : idempotencyKey,
        ),
      ),
  );

  server.registerTool(
    'run_audit',
    {
      title: 'Run audit',
      description: 'Enqueue an SEO or full audit for a website (requires completed crawl for SEO).',
      inputSchema: {
        websiteId: z.string().uuid(),
        mode: z.enum(['seo', 'full']).default('seo'),
        idempotencyKey: z.string().min(1).max(200).optional(),
      },
    },
    async ({ websiteId, mode, idempotencyKey }) =>
      text(
        await services.auditService.enqueueAudit(
          websiteId,
          mode,
          idempotencyKey === undefined ? undefined : idempotencyKey,
        ),
      ),
  );

  server.registerTool(
    'get_audit',
    {
      title: 'Get audit',
      description: 'Fetch an audit run by id.',
      inputSchema: {
        auditId: z.string().uuid(),
      },
    },
    async ({ auditId }) => text(await services.auditService.getAudit(auditId)),
  );

  server.registerTool(
    'get_score',
    {
      title: 'Get audit score',
      description: 'Fetch the deterministic score for an audit.',
      inputSchema: {
        auditId: z.string().uuid(),
      },
    },
    async ({ auditId }) => text(await services.auditService.getScore(auditId)),
  );

  server.registerTool(
    'list_findings',
    {
      title: 'List findings',
      description: 'List findings for an audit run.',
      inputSchema: {
        auditId: z.string().uuid(),
      },
    },
    async ({ auditId }) => text(await services.auditService.listFindings(auditId)),
  );

  server.registerTool(
    'list_opportunities',
    {
      title: 'List opportunities',
      description: 'Rank discovered businesses by opportunity score.',
    },
    async () => text(await services.discoveryService.listOpportunities()),
  );

  server.registerTool(
    'get_job',
    {
      title: 'Get job',
      description: 'Fetch a job by id.',
      inputSchema: {
        jobId: z.string().uuid(),
      },
    },
    async ({ jobId }) => text(await services.auditService.getJob(jobId)),
  );

  return server;
}
