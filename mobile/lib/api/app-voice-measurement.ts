import { apiRequest } from '@/lib/api';
import type { SubmitVoiceMeasurementBody } from '@/lib/api/types/voice-measurement.types';

const BASE = '/api/app/voice-measurements';

export function submitVoiceMeasurement(body: SubmitVoiceMeasurementBody): Promise<void> {
  return apiRequest<void>(BASE, { json: body, method: 'POST' });
}
