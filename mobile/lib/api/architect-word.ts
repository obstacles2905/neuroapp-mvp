import { apiRequest } from '@/lib/api';
import type { ArchitectWordPresentation } from '@/lib/api/types/architect-word.types';

const BASE = '/api/app/architect-word';

export function fetchArchitectWordPresentation(
  options: { replay?: boolean } = {},
): Promise<ArchitectWordPresentation> {
  const replay = options.replay === true;
  const query = replay ? '?replay=true' : '';
  return apiRequest<ArchitectWordPresentation>(`${BASE}/presentation${query}`, {
    method: 'GET',
  });
}

export function completeArchitectWord(): Promise<void> {
  return apiRequest<void>(`${BASE}/complete`, { method: 'POST' });
}
