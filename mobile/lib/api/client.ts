import { getApiBaseUrl } from '@/lib/api/config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: unknown = undefined,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiRequestOptions = RequestInit & {
  json?: unknown;
};

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnUnauthorized(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  if (path.startsWith('http')) {
    return path;
  }
  const prefix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${prefix}`;
}

export async function apiRequest<T>(path: string, init: ApiRequestOptions = {}): Promise<T> {
  const { json, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(buildUrl(path), {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (res.status === 401) {
    onUnauthorized?.();
  }

  if (!res.ok) {
    let errBody: unknown;
    const ct = res.headers.get('content-type');
    try {
      if (ct?.includes('application/json')) {
        errBody = await res.json();
      } else {
        errBody = await res.text();
      }
    } catch {
      errBody = undefined;
    }
    const msg =
      typeof errBody === 'object' && errBody !== null && 'message' in errBody
        ? String((errBody as { message: unknown }).message)
        : res.statusText;
    throw new ApiError(res.status, msg, errBody);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  if (res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  const ct = res.headers.get('content-type');
  if (ct && !ct.includes('application/json')) {
    return (await res.text()) as T;
  }
  return (await res.json()) as T;
}
