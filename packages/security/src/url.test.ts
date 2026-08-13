import { describe, expect, it } from 'vitest';
import { normalizeUrl, UrlSecurityError } from './url.js';

describe('normalizeUrl', () => {
  it('normalizes protocol, host, trailing slash, and tracking params', () => {
    const url = normalizeUrl('HTTP://Example.com/?utm_source=test&b=2&a=1');
    expect(url.toString()).toBe('http://example.com/?a=1&b=2');
  });

  it('rejects localhost', () => {
    expect(() => normalizeUrl('https://localhost/path')).toThrow(UrlSecurityError);
  });

  it('allows localhost when opted in', () => {
    const url = normalizeUrl('http://localhost:4173/path', { allowLocalhost: true });
    expect(url.hostname).toBe('localhost');
    expect(url.port).toBe('4173');
  });

  it('rejects private IPv4', () => {
    expect(() => normalizeUrl('https://127.0.0.1/')).toThrow(UrlSecurityError);
    expect(() => normalizeUrl('https://10.0.0.5/')).toThrow(UrlSecurityError);
    expect(() => normalizeUrl('https://192.168.1.1/')).toThrow(UrlSecurityError);
  });

  it('rejects non-http schemes', () => {
    expect(() => normalizeUrl('file:///etc/passwd')).toThrow(UrlSecurityError);
    expect(() => normalizeUrl('ftp://example.com')).toThrow(UrlSecurityError);
    expect(() => normalizeUrl('data:text/plain,hi')).toThrow(UrlSecurityError);
  });
});
