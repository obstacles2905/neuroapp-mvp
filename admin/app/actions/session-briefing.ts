'use server';

import { apiDelete, apiPut } from '@/lib/api/server-client';
import type {
  SessionBriefingAdminVideo,
  SessionBriefingPhase,
} from '@/lib/types/session-briefing';
import { revalidatePath } from 'next/cache';

function briefingPagePath(phase: SessionBriefingPhase): string {
  return phase === 'greeting' ? '/briefing/greeting' : '/briefing/final-word';
}

export async function upsertSessionBriefingAction(
  phase: SessionBriefingPhase,
  payload: { s3Key?: string; isPublished?: boolean },
): Promise<SessionBriefingAdminVideo> {
  const result = await apiPut<object, SessionBriefingAdminVideo>(
    `/session-briefing/${phase}`,
    payload,
  );
  revalidatePath(briefingPagePath(phase));
  return result;
}

export async function clearSessionBriefingAction(
  phase: SessionBriefingPhase,
): Promise<void> {
  await apiDelete(`/session-briefing/${phase}`);
  revalidatePath(briefingPagePath(phase));
}
