import { getApiBase } from '@/lib/api/config';
import type { PresignMediaUploadPayload } from '@/lib/api/upload-media';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const jar = await cookies();
  const token = jar.get('admin_token')?.value;
  if (!token) {
    return Response.json({ message: 'Не авторизован' }, { status: 401 });
  }

  let payload: PresignMediaUploadPayload;
  try {
    payload = (await request.json()) as PresignMediaUploadPayload;
  } catch {
    return Response.json({ message: 'Некорректный запрос' }, { status: 400 });
  }

  const upstream = await fetch(`${getApiBase()}/media/presign`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok) {
    const text = (await upstream.text()).trim();
    return new Response(text || `Не удалось подготовить загрузку (${upstream.status})`, {
      status: upstream.status,
    });
  }

  return Response.json(await upstream.json());
}
