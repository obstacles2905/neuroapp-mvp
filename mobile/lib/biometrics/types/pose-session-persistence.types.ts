import type {
  PoseBurstSessionLegacyResult,
  PoseDualViewSessionResult,
  PoseInterpretationTone,
  PoseSessionQuality,
  PoseUserInterpretation,
} from '@/lib/biometrics/types/pose-measurement.types';

/** Запись v2 — два ракурса + числовой отчёт, без текстовой «интерпретации». */
export interface PersistedPoseSessionDualRecord {
  persistedAtIso: string;
  result: PoseDualViewSessionResult;
  schemaVersion: '2';
  sessionId: string;
}

/** Legacy: одно фото-буферное состояние + старая интерпретация. */
export interface PersistedPoseSessionLegacyRecord {
  interpretation: PoseUserInterpretation;
  persistedAtIso: string;
  result: PoseBurstSessionLegacyResult;
  schemaVersion: '1';
  sessionId: string;
}

export type PersistedPoseSessionRecord = PersistedPoseSessionDualRecord | PersistedPoseSessionLegacyRecord;

export function isDualPosePersistRecord(
  r: PersistedPoseSessionRecord,
): r is PersistedPoseSessionDualRecord {
  return r.schemaVersion === '2';
}

/** Строка индекса для списка истории (без тяжёлых полей). */
export interface PoseSessionHistoryListItem {
  capturedAtIso: string;
  headline: string;
  quality: PoseSessionQuality;
  sessionId: string;
  tone: PoseInterpretationTone;
}

export interface PoseSessionsIndexFile {
  entries: PoseSessionHistoryListItem[];
  schemaVersion: string;
}
