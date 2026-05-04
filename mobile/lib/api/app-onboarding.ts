import { apiRequest } from '@/lib/api';
import type { AppSymptomListItem } from '@/lib/api/types/onboarding.types';

const BASE = '/api/app/onboarding';

export function fetchOnboardingSymptoms(): Promise<AppSymptomListItem[]> {
  return apiRequest<AppSymptomListItem[]>(`${BASE}/symptoms`, { method: 'GET' });
}

export function submitOnboarding(orderedSymptomIds: string[]): Promise<void> {
  return apiRequest<void>(`${BASE}/complete`, {
    method: 'POST',
    json: { orderedSymptomIds },
  });
}

export function replayOnboarding(): Promise<void> {
  return apiRequest<void>(`${BASE}/replay`, { method: 'POST' });
}

export function skipOnboarding(): Promise<void> {
  return apiRequest<void>(`${BASE}/skip`, { method: 'POST' });
}
