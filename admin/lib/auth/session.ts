import { getApiBase } from '@/lib/api/config';
import { cookies } from 'next/headers';
import type { AdminMe } from '@/lib/types/me';

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
