import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { assertPublicHostname, normalizeUrl, UrlSecurityError } from './url.js';

export interface ValidateCrawlUrlOptions {
  allowLocalhost?: boolean;
}

function isPrivateResolvedAddress(address: string, family: number): void {
  if (family === 4 || isIP(address) === 4) {
    assertPublicHostname(address);
    return;
  }
  assertPublicHostname(address.includes(':') ? `[${address}]` : address);
}

/**
 * Validate, normalize, and ensure the destination does not resolve to a private address (SSRF).
 */
export async function validateCrawlUrl(
  input: string,
  options: ValidateCrawlUrlOptions = {},
): Promise<URL> {
  const url = normalizeUrl(input, { allowLocalhost: options.allowLocalhost === true });

  if (options.allowLocalhost === true) {
    return url;
  }

  if (isIP(url.hostname) !== 0) {
    assertPublicHostname(url.hostname);
    return url;
  }

  let records: Array<{ address: string; family: number }>;
  try {
    records = await lookup(url.hostname, { all: true, verbatim: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DNS lookup failed';
    throw new UrlSecurityError(message, 'DNS_RESOLUTION_FAILED');
  }

  if (records.length === 0) {
    throw new UrlSecurityError(`No DNS records for ${url.hostname}`, 'DNS_RESOLUTION_FAILED');
  }

  for (const record of records) {
    try {
      isPrivateResolvedAddress(record.address, record.family);
    } catch (error) {
      if (error instanceof UrlSecurityError) {
        throw new UrlSecurityError(
          `Host ${url.hostname} resolves to blocked address ${record.address}`,
          'PRIVATE_ADDRESS',
        );
      }
      throw error;
    }
  }

  return url;
}
