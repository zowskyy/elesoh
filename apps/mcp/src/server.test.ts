import { describe, expect, it } from 'vitest';
import { FORBIDDEN_MCP_TOOL_NAMES, PRODUCT_MCP_TOOL_NAMES } from './server.js';

describe('product MCP allowlist', () => {
  it('exposes only approved tool names and never dangerous ones', () => {
    expect(PRODUCT_MCP_TOOL_NAMES).toContain('get_audit');
    expect(PRODUCT_MCP_TOOL_NAMES).toContain('run_audit');
    expect(PRODUCT_MCP_TOOL_NAMES).toHaveLength(9);
    for (const forbidden of FORBIDDEN_MCP_TOOL_NAMES) {
      expect(PRODUCT_MCP_TOOL_NAMES).not.toContain(forbidden);
    }
  });
});
