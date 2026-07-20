import type {
  FaceExpressionMeasurementSession,
  FacePhaseMetricsSnapshot,
} from '@/lib/biometrics/types/face-measurement.types';

export type FaceSessionHistoryListItem = Readonly<{
  capturedAtIso: string;
  expressivenessScore: number;
  headline: string;
  quality: string;
  sessionId: string;
  tone: 'attention' | 'neutral' | 'positive';
}>;

export type FaceSessionsIndexFile = Readonly<{
  entries: FaceSessionHistoryListItem[];
  schemaVersion: number;
}>;

export type PersistedFaceSessionRecord = Readonly<{
  manifest: FaceExpressionMeasurementSession;
  phaseSnapshots: readonly FacePhaseMetricsSnapshot[];
  schemaVersion: number;
}>;
