import { z } from 'zod';

export const aiNarrativeSchema = z.object({
  executiveSummary: z.string().min(1).max(2000),
  highlights: z.array(z.string().min(1).max(500)).max(10),
  topActions: z
    .array(
      z.object({
        ruleId: z.string().min(1).max(64),
        explanation: z.string().min(1).max(1000),
      }),
    )
    .max(10),
  caveats: z.array(z.string().min(1).max(500)).max(10),
});

export type AiNarrative = z.infer<typeof aiNarrativeSchema>;

export interface AiAuditInput {
  websiteUrl: string;
  businessName?: string;
  overallScore: number;
  seoScore: number;
  performanceScore: number | null;
  findings: Array<{
    ruleId: string;
    outcome: string;
    summary: string;
  }>;
  recommendations: Array<{
    ruleId?: string;
    priority: string;
    action: string;
  }>;
}

export interface ExplainOptions {
  ollamaUrl: string;
  model: string;
  enabled?: boolean;
  timeoutMs?: number;
}
