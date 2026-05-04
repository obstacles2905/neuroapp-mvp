import { cookies } from 'next/headers';

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:3000/api/admin';
}

async function authHeaders(): Promise<HeadersInit> {
  const jar = await cookies();
  const token = jar.get('admin_token')?.value;
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet<T>(path: string): Promise<T> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${getApiBase()}${normalized}`;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: await authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`API ${response.status} ${url}`);
  }
  return response.json() as Promise<T>;
}

export async function apiPost<TBody extends object, TRes>(
  path: string,
  body: TBody,
): Promise<TRes> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${getApiBase()}${normalized}`;
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as TRes;
  }
  return response.json() as Promise<TRes>;
}

export async function apiPatch<TBody extends object, TRes>(
  path: string,
  body: TBody,
): Promise<TRes> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${getApiBase()}${normalized}`;
  const headers = {
    ...(await authHeaders()),
    'Content-Type': 'application/json',
  };
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as TRes;
  }
  return response.json() as Promise<TRes>;
}

export async function apiDelete(path: string): Promise<void> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `${getApiBase()}${normalized}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API ${response.status}`);
  }
}
