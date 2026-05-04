import { cookies } from 'next/headers';
import type { AdminMe } from '@/lib/types/me';

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:3000/api/admin';
}

export async function getMe(): Promise<AdminMe | null> {
  const jar = await cookies();
  const token = jar.get('admin_token')?.value;
  if (!token) {
    return null;
  }
  const response = await fetch(`${getApiBase()}/auth/me`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<AdminMe>;
}
