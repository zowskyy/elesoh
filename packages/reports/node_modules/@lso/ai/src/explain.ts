import { buildFallbackNarrative } from './fallback.js';
import { aiNarrativeSchema, type AiAuditInput, type AiNarrative, type ExplainOptions } from './types.js';

function allowedRuleIds(input: AiAuditInput): Set<string> {
  return new Set(input.findings.map((finding) => finding.ruleId));
}

function sanitizeNarrative(input: AiAuditInput, narrative: AiNarrative): AiNarrative {
  const allowed = allowedRuleIds(input);
  return {
    executiveSummary: narrative.executiveSummary,
    highlights: narrative.highlights.slice(0, 10),
    topActions: narrative.topActions
      .filter((action) => allowed.has(action.ruleId) || action.ruleId === 'UNKNOWN')
      .slice(0, 10),
    caveats: [
      ...narrative.caveats.slice(0, 8),
      'Narrative sanitized: only provided rule IDs and scores may appear.',
    ].slice(0, 10),
  };
}

function buildPrompt(input: AiAuditInput): string {
  const payload = {
    websiteUrl: input.websiteUrl,
    businessName: input.businessName ?? null,
    scores: {
      overall: input.overallScore,
      seo: input.seoScore,
      performance: input.performanceScore,
    },
    findings: input.findings.slice(0, 40),
    recommendations: input.recommendations.slice(0, 20),
    constraints: [
      'Do not create new findings or rule IDs.',
      'Do not change or invent scores.',
      'Do not invent business facts.',
      'Do not fetch URLs or claim to have browsed the web.',
      'Explain only the provided findings and recommendations.',
      'Return JSON matching the schema exactly.',
    ],
  };

  return [
    'You explain LocalSite Optimizer audit results.',
    'Respond with JSON only.',
    JSON.stringify(payload),
  ].join('\n');
}

async function callOllama(
  options: ExplainOptions,
  prompt: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  try {
    const response = await fetch(`${options.ollamaUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: options.model,
        stream: false,
        format: 'json',
        messages: [
          {
            role: 'system',
            content:
              'You are a constrained SEO audit narrator. You never create findings, mutate scores, invent business data, or fetch URLs. Output JSON only.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }
    const body = (await response.json()) as { message?: { content?: string } };
    const content = body.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      throw new Error('Ollama returned empty content');
    }
    return JSON.parse(content) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Produce a validated audit narrative.
 * Falls back to deterministic text when AI is disabled or Ollama fails.
 */
export async function explainAudit(
  input: AiAuditInput,
  options: ExplainOptions,
): Promise<{ narrative: AiNarrative; source: 'ollama' | 'fallback' }> {
  const fallback = buildFallbackNarrative(input);
  if (options.enabled === false) {
    return { narrative: fallback, source: 'fallback' };
  }

  try {
    const raw = await callOllama(options, buildPrompt(input));
    const parsed = aiNarrativeSchema.parse(raw);
    return { narrative: sanitizeNarrative(input, parsed), source: 'ollama' };
  } catch {
    return { narrative: fallback, source: 'fallback' };
  }
}
