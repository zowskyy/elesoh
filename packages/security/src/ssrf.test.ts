import { describe, expect, it } from 'vitest';
import { validateCrawlUrl } from './ssrf.js';
import { UrlSecurityError } from './url.js';

describe('validateCrawlUrl', () => {
  it('accepts a public hostname', async () => {
    const url = await validateCrawlUrl('https://example.com');
    expect(url.hostname).toBe('example.com');
  });

  it('rejects hosts that resolve to loopback when given literal private IP', async () => {
    await expect(validateCrawlUrl('http://127.0.0.1')).rejects.toBeInstanceOf(UrlSecurityError);
  });

  it('allows localhost when opted in', async () => {
    const url = await validateCrawlUrl('http://127.0.0.1:4173/', { allowLocalhost: true });
    expect(url.hostname).toBe('127.0.0.1');
  });
});
