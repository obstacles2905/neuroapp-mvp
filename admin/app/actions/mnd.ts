'use server';

import { apiPost } from '@/lib/api/server-client';
import { apiDelete, apiPatch } from '@/lib/api/server-client';
import type { LocalizedText, MndExercise, MndExerciseDirection } from '@/lib/types/api';
import type { LessonStep, LessonStepType } from '@/lib/types/lesson-step';
import { defaultContentForType } from '@/lib/types/lesson-step';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function readLocalized(formData: FormData, prefix: string): LocalizedText {
  return {
    ru: String(formData.get(`${prefix}_ru`) ?? ''),
    uk: String(formData.get(`${prefix}_uk`) ?? ''),
    en: String(formData.get(`${prefix}_en`) ?? ''),
  };
}

function parseDirection(raw: string): MndExerciseDirection {
  if (raw === 'top_down') {
    return 'top_down';
  }
  return 'bottom_up';
}

function parseNumber(raw: FormDataEntryValue | null, fallback: number): number {
  const value = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

export async function createMndExerciseAction(formData: FormData): Promise<void> {
  const created = await apiPost<object, MndExercise>('/mnd/exercises', {
    masterStackId: String(formData.get('masterStackId') ?? ''),
    direction: parseDirection(String(formData.get('direction') ?? 'bottom_up')),
    complexityLevel: parseNumber(formData.get('complexityLevel'), 1),
    title: readLocalized(formData, 'title'),
    content: null,
    order: parseNumber(formData.get('order'), 0),
    isPublished: formData.get('isPublished') === 'on',
  });

  revalidatePath('/mnd');
  redirect(exerciseBuilderPath(created.id));
}

export async function updateMndStackActiveAction(
  stackId: string,
  isActive: boolean,
): Promise<void> {
  await apiPatch(`/mnd/master-stacks/${stackId}`, { isActive });
  revalidatePath('/mnd');
}

export async function updateMndSymptomPublishedAction(
  symptomId: string,
  isPublished: boolean,
): Promise<void> {
  await apiPatch(`/mnd/symptoms/${symptomId}`, { isPublished });
  revalidatePath('/mnd');
}

export async function updateMndExercisePublishedAction(
  exerciseId: string,
  isPublished: boolean,
): Promise<void> {
  await apiPatch(`/mnd/exercises/${exerciseId}`, { isPublished });
  revalidatePath('/mnd');
  revalidatePath(`/mnd/exercises/${exerciseId}/builder`);
}

function exerciseBuilderPath(exerciseId: string): string {
  return `/mnd/exercises/${exerciseId}/builder`;
}

function exerciseStepsBase(exerciseId: string, blockId: string): string {
  return `/mnd/exercises/${exerciseId}/blocks/${blockId}/steps`;
}

export async function createMndExerciseStepAction(
  exerciseId: string,
  blockId: string,
  type: LessonStepType,
): Promise<LessonStep> {
  const content = defaultContentForType(type);
  const created = await apiPost<{ type: LessonStepType; content: unknown }, LessonStep>(
    exerciseStepsBase(exerciseId, blockId),
    { type, content },
  );
  revalidatePath(exerciseBuilderPath(exerciseId));
  return created;
}

export async function updateMndExerciseStepAction(
  exerciseId: string,
  blockId: string,
  stepId: string,
  patch: { type?: LessonStepType; content?: unknown; order?: number },
): Promise<LessonStep> {
  const updated = await apiPatch<typeof patch, LessonStep>(
    `${exerciseStepsBase(exerciseId, blockId)}/${stepId}`,
    patch,
  );
  revalidatePath(exerciseBuilderPath(exerciseId));
  return updated;
}

export async function reorderMndExerciseStepsAction(
  exerciseId: string,
  blockId: string,
  items: { id: string; order: number }[],
): Promise<void> {
  await apiPatch<{ items: { id: string; order: number }[] }, void>(
    `${exerciseStepsBase(exerciseId, blockId)}/order`,
    { items },
  );
  revalidatePath(exerciseBuilderPath(exerciseId));
}

export async function deleteMndExerciseStepAction(
  exerciseId: string,
  blockId: string,
  stepId: string,
): Promise<void> {
  await apiDelete(`${exerciseStepsBase(exerciseId, blockId)}/${stepId}`);
  revalidatePath(exerciseBuilderPath(exerciseId));
}

export async function updateMndExerciseMetaAction(
  exerciseId: string,
  patch: Partial<Pick<MndExercise, 'isPublished'>>,
): Promise<MndExercise> {
  const updated = await apiPatch<typeof patch, MndExercise>(
    `/mnd/exercises/${exerciseId}`,
    patch,
  );
  revalidatePath('/mnd');
  revalidatePath(exerciseBuilderPath(exerciseId));
  return updated;
}
