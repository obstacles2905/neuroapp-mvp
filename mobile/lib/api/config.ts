const DEFAULT_DEV_API = 'http://localhost:3000';

/** Admin panel uses `.../api/admin`; mobile app routes live under `/api/app`. */
const ADMIN_API_SUFFIX = /\/api\/admin\/?$/i;

/**
 * Public env `EXPO_PUBLIC_API_URL` is inlined at build time. Fallback for local dev
 * (Nest default port). For Android emulator use e.g. `http://10.0.2.2:3000` instead of `localhost`.
 *
 * Must be the API **origin only** (e.g. `https://api.up.railway.app`), not `.../api/admin`.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  if (raw === undefined || raw.length === 0) {
    return DEFAULT_DEV_API;
  }
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (ADMIN_API_SUFFIX.test(trimmed)) {
    return trimmed.replace(ADMIN_API_SUFFIX, '');
  }
  return trimmed;
}
