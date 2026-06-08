import { getApiBase } from '@/lib/api/config';
import type { UploadMediaResult } from '@/lib/api/upload-media';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const jar = await cookies();
  const token = jar.get('admin_token')?.value;
  if (!token) {
    return Response.json({ message: 'Не авторизован' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ message: 'Некорректный запрос загрузки' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ message: 'Выберите файл' }, { status: 400 });
  }

  const folder = String(formData.get('folder') ?? 'lessons').trim() || 'lessons';
  const upstreamBody = new FormData();
  upstreamBody.append('file', file);

  const upstreamUrl = `${getApiBase()}/media/upload?folder=${encodeURIComponent(folder)}`;
  const upstream = await fetch(upstreamUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: upstreamBody,
  });

  if (!upstream.ok) {
    const text = (await upstream.text()).trim();
    return new Response(text || `Загрузка не удалась (${upstream.status})`, {
      status: upstream.status,
    });
  }

  const result = (await upstream.json()) as UploadMediaResult;
  return Response.json(result);
}
