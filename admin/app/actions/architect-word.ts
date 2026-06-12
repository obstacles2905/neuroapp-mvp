'use server';

import { apiDelete, apiPut } from '@/lib/api/server-client';
import type { ArchitectWordAdminSlot } from '@/lib/types/architect-word';
import { revalidatePath } from 'next/cache';

function architectWordPath(symptomId: string): string {
  return `/mnd/symptoms/${symptomId}/architect-word`;
}

export async function upsertArchitectWordSlotAction(
  symptomId: string,
  slot: number,
  payload: { s3Key?: string; isPublished?: boolean },
): Promise<ArchitectWordAdminSlot> {
  const result = await apiPut<object, ArchitectWordAdminSlot>(
    `/mnd/symptoms/${symptomId}/architect-word/${slot}`,
    payload,
  );
  revalidatePath(architectWordPath(symptomId));
  revalidatePath('/mnd');
  return result;
}

export async function clearArchitectWordSlotAction(
  symptomId: string,
  slot: number,
): Promise<void> {
  await apiDelete(`/mnd/symptoms/${symptomId}/architect-word/${slot}`);
  revalidatePath(architectWordPath(symptomId));
  revalidatePath('/mnd');
}
