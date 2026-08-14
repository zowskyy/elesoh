import { describe, expect, it } from 'vitest';
import { batchAnalyzeRequestSchema } from '@lso/schemas';

describe('batchAnalyzeRequestSchema', () => {
  it('accepts up to 50 urls', () => {
    const urls = Array.from({ length: 3 }, (_, index) => `https://example-${index}.com`);
    const parsed = batchAnalyzeRequestSchema.parse({ urls });
    expect(parsed.urls).toHaveLength(3);
  });

  it('rejects empty url lists', () => {
    expect(() => batchAnalyzeRequestSchema.parse({ urls: [] })).toThrow();
  });
});
