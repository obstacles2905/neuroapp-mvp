import type {
  VoiceInterpretationTone,
  VoiceMeasurementSession,
  VoiceSessionQualityOverall,
} from '@/lib/biometrics/types/voice-measurement.types';

export interface PersistedVoiceSessionRecord {
  persistedAtIso: string;
  result: VoiceMeasurementSession;
  schemaVersion: string;
  sessionId: string;
}

export interface VoiceSessionsIndexFile {
  entries: VoiceSessionHistoryListItem[];
  schemaVersion: string;
}

export interface VoiceSessionHistoryListItem {
  capturedAtIso: string;
  headline: string;
  quality: VoiceSessionQualityOverall;
  sessionId: string;
  tone: VoiceInterpretationTone;
}
