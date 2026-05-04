import { apiRequest } from '@/lib/api';
import type { ActivityCalendarResponse } from '@/lib/api/types/activity.types';

const BASE = '/api/app/activity';

export function resetActivityStreak(): Promise<void> {
  return apiRequest<void>(`${BASE}/streak/reset`, { method: 'POST' });
}

export function fetchActivityCalendar(
  year: number,
  month: number,
): Promise<ActivityCalendarResponse> {
  const q = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  return apiRequest<ActivityCalendarResponse>(`${BASE}/calendar?${q}`, {
    method: 'GET',
  });
}
