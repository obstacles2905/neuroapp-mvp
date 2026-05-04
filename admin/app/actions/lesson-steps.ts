'use server';

import { apiDelete, apiPatch, apiPost } from '@/lib/api/server-client';
import type { LessonStep, LessonStepType } from '@/lib/types/lesson-step';
import { defaultContentForType } from '@/lib/types/lesson-step';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:3000/api/admin';
}

async function authHeader(): Promise<HeadersInit> {
  const jar = await cookies();
  const token = jar.get('admin_token')?.value;
  if (!token) {
    throw new Error('Не авторизован');
  }
  return { Authorization: `Bearer ${token}` };
}

function builderPath(lessonId: string): string {
  return `/content/lessons/${lessonId}/builder`;
}

function stepsBase(lessonId: string, blockId: string): string {
  return `/lessons/${lessonId}/blocks/${blockId}/steps`;
}

export async function createLessonStepAction(
  lessonId: string,
  blockId: string,
  type: LessonStepType,
): Promise<LessonStep> {
  const content = defaultContentForType(type);
  const created = await apiPost<{ type: LessonStepType; content: unknown }, LessonStep>(
    stepsBase(lessonId, blockId),
    { type, content },
  );
  revalidatePath(builderPath(lessonId));
  return created;
}

export async function updateLessonStepAction(
  lessonId: string,
  blockId: string,
  stepId: string,
  patch: { type?: LessonStepType; content?: unknown; order?: number },
): Promise<LessonStep> {
  const updated = await apiPatch<typeof patch, LessonStep>(
    `${stepsBase(lessonId, blockId)}/${stepId}`,
    patch,
  );
  revalidatePath(builderPath(lessonId));
  return updated;
}

export async function reorderLessonStepsAction(
  lessonId: string,
  blockId: string,
  items: { id: string; order: number }[],
): Promise<void> {
  await apiPatch<{ items: { id: string; order: number }[] }, void>(
    `${stepsBase(lessonId, blockId)}/order`,
    { items },
  );
  revalidatePath(builderPath(lessonId));
}

export async function deleteLessonStepAction(
  lessonId: string,
  blockId: string,
  stepId: string,
): Promise<void> {
  await apiDelete(`${stepsBase(lessonId, blockId)}/${stepId}`);
  revalidatePath(builderPath(lessonId));
}

export type UploadMediaResult = { s3Key: string; url: string };

export async function uploadLessonMediaAction(
  formData: FormData,
): Promise<UploadMediaResult> {
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Выберите файл');
  }
  const folder = String(formData.get('folder') ?? 'lessons').trim() || 'lessons';
  const body = new FormData();
  body.append('file', file);
  const url = `${getApiBase()}/media/upload?folder=${encodeURIComponent(folder)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: await authHeader(),
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Загрузка не удалась (${response.status})`);
  }
  return response.json() as Promise<UploadMediaResult>;
}

export async function publishLessonAction(
  lessonId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const normalized = `/lessons/${lessonId}/publish`;
    const apiUrl = `${getApiBase()}${normalized}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: await authHeader(),
    });
    if (!response.ok) {
      const message = (await response.text()).trim() || `HTTP ${response.status}`;
      return { ok: false, message };
    }
    revalidatePath(builderPath(lessonId));
    revalidatePath('/content/lessons');
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Ошибка публикации';
    return { ok: false, message };
  }
}
