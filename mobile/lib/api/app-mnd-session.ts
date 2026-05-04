import { apiRequest } from '@/lib/api';
import type { AppDailyMndSession } from '@/lib/api/types/mnd-session.types';

export function fetchDailyMndSession(): Promise<AppDailyMndSession> {
  return apiRequest<AppDailyMndSession>('/api/app/mnd/session/daily', {
    method: 'GET',
  });
}

export function fetchSosMndSession(symptomId: string): Promise<AppDailyMndSession> {
  return apiRequest<AppDailyMndSession>('/api/app/mnd/session/sos', {
    method: 'POST',
    json: { symptomId },
  });
}

export function fetchJamMndSession(): Promise<AppDailyMndSession> {
  return apiRequest<AppDailyMndSession>('/api/app/mnd/session/jam', {
    method: 'GET',
  });
}
