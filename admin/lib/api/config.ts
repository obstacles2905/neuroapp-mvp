const DEFAULT_DEV_API_BASE = 'http://127.0.0.1:3000/api/admin';

/**
 * Public env `NEXT_PUBLIC_API_BASE` is inlined at build time.
 * Must point to Nest admin routes, e.g. `https://api.example.com/api/admin`.
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE;
  if (raw === undefined || raw.length === 0) {
    return DEFAULT_DEV_API_BASE;
  }
  return raw.replace(/\/$/, '');
}

export function isProductionDeployment(): boolean {
  return process.env.NODE_ENV === 'production';
}
