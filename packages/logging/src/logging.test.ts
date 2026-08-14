import { describe, expect, it } from 'vitest';
import { createLogger, createRequestId, withCorrelationId } from './index.js';

describe('logging correlation', () => {
  it('reuses a provided request id and generates otherwise', () => {
    expect(createRequestId('abc-123')).toBe('abc-123');
    expect(createRequestId('')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('attaches requestId on child logger bindings', () => {
    const root = createLogger({ name: 'test', level: 'silent' });
    const child = withCorrelationId(root, 'req-1');
    expect(child.bindings()).toMatchObject({ requestId: 'req-1' });
  });
});
