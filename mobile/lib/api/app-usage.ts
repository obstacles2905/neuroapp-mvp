import { apiRequest } from '@/lib/api';

export type UsageSegmentKind = 'app' | 'exercise';

export type UsageSegmentContext = 'foreground' | 'lesson' | 'mnd_exercise';

export type UsageSegmentPayload = {
  clientEventId: string;
  kind: UsageSegmentKind;
  context: UsageSegmentContext;
  contextId?: string;
  startedAt: string;
  endedAt: string;
};

export function submitUsageSegments(
  ianaTimeZone: string,
  segments: UsageSegmentPayload[],
): Promise<void> {
  return apiRequest<void>('/api/app/usage/segments', {
    method: 'POST',
    json: { ianaTimeZone, segments },
  });
}
