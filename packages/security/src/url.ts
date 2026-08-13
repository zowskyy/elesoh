export class UrlSecurityError extends Error {
  public override readonly name = 'UrlSecurityError';

  public constructor(
    message: string,
    public readonly code:
      | 'INVALID_URL'
      | 'UNSUPPORTED_PROTOCOL'
      | 'BLOCKED_HOST'
      | 'PRIVATE_ADDRESS'
      | 'DNS_RESOLUTION_FAILED',
  ) {
    super(message);
  }
}

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'fbclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
]);

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata',
]);

function isIpv4(hostname: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    throw new UrlSecurityError(`Invalid IPv4 address: ${ip}`, 'INVALID_URL');
  }
  const [a = 0, b = 0, c = 0, d = 0] = parts;
  return (((a << 24) >>> 0) + ((b << 16) >>> 0) + ((c << 8) >>> 0) + d) >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  const ranges: Array<[number, number]> = [
    [ipv4ToInt('0.0.0.0'), ipv4ToInt('0.255.255.255')],
    [ipv4ToInt('10.0.0.0'), ipv4ToInt('10.255.255.255')],
    [ipv4ToInt('127.0.0.0'), ipv4ToInt('127.255.255.255')],
    [ipv4ToInt('169.254.0.0'), ipv4ToInt('169.254.255.255')],
    [ipv4ToInt('172.16.0.0'), ipv4ToInt('172.31.255.255')],
    [ipv4ToInt('192.168.0.0'), ipv4ToInt('192.168.255.255')],
  ];
  return ranges.some(([start, end]) => value >= start && value <= end);
}

function isPrivateIpv6(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') {
    return true;
  }
  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) {
    return true;
  }
  if (host.startsWith('::ffff:')) {
    const mapped = host.slice('::ffff:'.length);
    if (isIpv4(mapped)) {
      return isPrivateIpv4(mapped);
    }
  }
  return false;
}

export function assertPublicHostname(
  hostname: string,
  options: { allowLocalhost?: boolean } = {},
): void {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (options.allowLocalhost === true) {
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host === '::1'
    ) {
      return;
    }
  }
  if (host === '' || BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost')) {
    throw new UrlSecurityError(`Blocked hostname: ${hostname}`, 'BLOCKED_HOST');
  }
  if (isIpv4(host)) {
    if (isPrivateIpv4(host)) {
      throw new UrlSecurityError(`Private IPv4 address blocked: ${hostname}`, 'PRIVATE_ADDRESS');
    }
    return;
  }
  if (host.includes(':') || host.startsWith('[')) {
    if (isPrivateIpv6(host)) {
      throw new UrlSecurityError(`Private IPv6 address blocked: ${hostname}`, 'PRIVATE_ADDRESS');
    }
  }
}

/**
 * Normalize a crawl candidate URL.
 * Strips tracking params, lowercases host, forces https when http is given for public hosts,
 * and removes default trailing slash on path-only roots.
 */
export function normalizeUrl(
  input: string,
  options: { allowLocalhost?: boolean } = {},
): URL {
  let raw = input.trim();
  if (raw === '') {
    throw new UrlSecurityError('URL is empty', 'INVALID_URL');
  }
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
    raw = `https://${raw}`;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UrlSecurityError(`Invalid URL: ${input}`, 'INVALID_URL');
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    throw new UrlSecurityError(`Unsupported protocol: ${url.protocol}`, 'UNSUPPORTED_PROTOCOL');
  }

  url.username = '';
  url.password = '';
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  assertPublicHostname(url.hostname, options);

  const params = [...url.searchParams.entries()].filter(
    ([key]) => !TRACKING_PARAMS.has(key.toLowerCase()),
  );
  params.sort(([a], [b]) => a.localeCompare(b));
  url.search = '';
  for (const [key, value] of params) {
    url.searchParams.append(key, value);
  }

  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }

  return url;
}

export function sameRegistrableHost(a: URL, b: URL): boolean {
  return a.hostname === b.hostname;
}
