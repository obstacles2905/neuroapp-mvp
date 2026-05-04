'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:3000/api/admin';
}

type LoginResponse = {
  accessToken: string;
  tokenType: string;
};

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const response = await fetch(`${getApiBase()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    redirect('/login?error=1');
  }
  const data = (await response.json()) as LoginResponse;
  const jar = await cookies();
  jar.set('admin_token', data.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete('admin_token');
  redirect('/login');
}

export async function joinRequestAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('displayName') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const response = await fetch(`${getApiBase()}/auth/join-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName: displayName || undefined,
      message: message || undefined,
    }),
  });
  if (!response.ok) {
    redirect('/join?error=1');
  }
  redirect('/join?sent=1');
}
