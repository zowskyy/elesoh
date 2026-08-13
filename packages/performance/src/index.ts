import type { EvaluatedFinding } from '@lso/audits';

export interface PerformanceMeasureResult {
  status: 'ok' | 'ERROR';
  error?: string;
  metrics?: Record<string, number>;
}

/**
 * sitespeed.io wrapper. When disabled or unavailable, returns ERROR so SEO can continue.
 */
export async function measurePerformance(
  url: string,
  options: { enabled?: boolean } = {},
): Promise<PerformanceMeasureResult> {
  if (options.enabled !== true) {
    return {
      status: 'ERROR',
      error: 'Performance measurement disabled (PERFORMANCE_ENABLED=false)',
    };
  }

  try {
    // Placeholder probe: confirm URL parses. Full sitespeed CLI integration lands with Stage G tooling.
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { status: 'ERROR', error: 'Unsupported performance URL protocol' };
    }
    return {
      status: 'ERROR',
      error: 'sitespeed.io runner not installed in this environment',
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'performance measure failed',
    };
  }
}

export function performanceFindings(
  evidenceId: string,
  result: PerformanceMeasureResult,
): EvaluatedFinding[] {
  if (result.status === 'ok') {
    return [
      {
        ruleId: 'PERF-SITESPEED-001',
        category: 'performance',
        evidenceId,
        outcome: 'PASS',
        summary: 'PERFORMANCE_OK',
        impact: 8,
        confidence: 0.8,
        effort: 1,
        action: 'Maintain current performance budget.',
      },
    ];
  }
  return [
    {
      ruleId: 'PERF-SITESPEED-001',
      category: 'performance',
      evidenceId,
      outcome: 'ERROR',
      summary: 'PERFORMANCE_UNAVAILABLE',
      impact: 8,
      confidence: 1,
      effort: 5,
      action: result.error ?? 'Enable and install sitespeed.io to collect performance metrics.',
    },
  ];
}
