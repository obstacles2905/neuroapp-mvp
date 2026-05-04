const DEFAULT_DEV_API = 'http://localhost:3000';

/**
 * Public env `EXPO_PUBLIC_API_URL` is inlined at build time. Fallback for local dev
 * (Nest default port). For Android emulator use e.g. `http://10.0.2.2:3000` instead of `localhost`.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  if (raw === undefined || raw.length === 0) {
    return DEFAULT_DEV_API;
  }
  return raw.replace(/\/$/, '');
}
