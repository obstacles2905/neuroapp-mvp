import { apiRequest } from '@/lib/api';
import type {
  SessionBriefingPhase,
  SessionBriefingPresentation,
} from '@/lib/api/types/session-briefing.types';

const BASE = '/api/app/session-briefing';

export function fetchSessionBriefingPresentation(
  phase: SessionBriefingPhase,
): Promise<SessionBriefingPresentation> {
  return apiRequest<SessionBriefingPresentation>(`${BASE}/${phase}/presentation`, {
    method: 'GET',
  });
}

export function completeSessionBriefing(phase: SessionBriefingPhase): Promise<void> {
  return apiRequest<void>(`${BASE}/${phase}/complete`, { method: 'POST' });
}
