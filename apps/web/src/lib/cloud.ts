/** Optional baked-in cloud API URL at APK build time. */
export const DEFAULT_CLOUD_API_URL =
  (import.meta.env.VITE_CLOUD_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export function isCloudApiUrl(url: string): boolean {
  if (DEFAULT_CLOUD_API_URL === '') return false;
  return url.replace(/\/$/, '') === DEFAULT_CLOUD_API_URL;
}
