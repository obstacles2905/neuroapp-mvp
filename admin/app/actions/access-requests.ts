'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:3000/api/admin';
}

async function authedPost(path: string): Promise<void> {
  const jar = await cookies();
  const token = jar.get('admin_token')?.value;
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }
}

export async function approveAccessRequestAction(id: string): Promise<void> {
  await authedPost(`/access-requests/${id}/approve`);
  revalidatePath('/settings/access-requests');
}

export async function rejectAccessRequestAction(id: string): Promise<void> {
  await authedPost(`/access-requests/${id}/reject`);
  revalidatePath('/settings/access-requests');
}

export async function approveAccessRequestFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id'));
  await approveAccessRequestAction(id);
}

export async function rejectAccessRequestFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id'));
  await rejectAccessRequestAction(id);
}
