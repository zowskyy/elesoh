/** Default cloud API used by the Android APK (no local computer). */
export const DEFAULT_CLOUD_API_URL =
  (import.meta.env.VITE_CLOUD_API_URL as string | undefined)?.replace(/\/$/, '') ??
  'https://lso-optimizer-api.onrender.com';

export function isCloudApiUrl(url: string): boolean {
  return url.replace(/\/$/, '') === DEFAULT_CLOUD_API_URL;
}
