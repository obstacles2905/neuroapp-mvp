'use server';

import { apiDelete, apiPatch, apiPost } from '@/lib/api/server-client';
import { getApiBase } from '@/lib/api/config';
import type { LessonStep, LessonStepType } from '@/lib/types/lesson-step';
import { defaultContentForType } from '@/lib/types/lesson-step';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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
