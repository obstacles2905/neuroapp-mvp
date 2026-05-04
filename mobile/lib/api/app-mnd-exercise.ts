import { apiRequest } from '@/lib/api';
import type { AppMndExerciseDetail } from '@/lib/api/types/mnd-exercise.types';

const BASE = '/api/app/mnd/exercises';

export function fetchMndExerciseDetail(id: string): Promise<AppMndExerciseDetail> {
  return apiRequest<AppMndExerciseDetail>(`${BASE}/${id}`, { method: 'GET' });
}

export function completeMndExercise(
  id: string,
  options?: { fromJam?: boolean },
): Promise<void> {
  const suffix =
    options?.fromJam === true ? '?fromJam=true' : '';
  return apiRequest<void>(`${BASE}/${id}/complete${suffix}`, {
    method: 'POST',
  });
}
