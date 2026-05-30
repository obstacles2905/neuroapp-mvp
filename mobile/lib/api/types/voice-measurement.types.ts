import type {
  VoiceAcousticSnapshot,
  VoiceComparison,
  VoiceCoreMetrics,
} from '@/lib/biometrics/types/voice-core-metrics.types';

/** Тело POST `/api/app/voice-measurements` (агрегаты без аудио). */
export type SubmitVoiceMeasurementBody = {
  acousticSnapshot?: VoiceAcousticSnapshotDto | undefined;
  capturedAt: string;
  comparison?: VoiceComparisonDto | undefined;
  coreMetrics?: VoiceCoreMetricsDto | undefined;
  durationMs: number;
  extractorId: 'opensmile';
  extractorVersion: string;
  featureSet: 'eGeMAPSv02' | 'ComParE_2016' | 'custom';
  id: string;
  interpretation?: VoiceInterpretationDto | undefined;
  metrics: VoiceProductMetricsDto;
  protocolVersion: string;
  quality: VoiceQualityResultDto;
  scoringVersion: string;
};

export type VoiceCoreMetricsDto = VoiceCoreMetrics;

export type VoiceAcousticSnapshotDto = {
  f0SemitoneMean?: number | undefined;
  f0SemitoneRange: number;
  hnrDb?: number | undefined;
  jitter: number;
  loudnessStddevNorm: number;
  shimmer: number;
  source: 'egemaps' | 'metering_proxy';
};

export type VoiceComparisonDto = VoiceComparison;

export type VoiceProductMetricsDto = {
  confidenceScore: number;
  emotionalActivationScore: number;
  monotonicityScore: number;
  throatTensionScore: number;
  tremorScore: number;
  vocalStabilityScore: number;
};

export type VoiceQualityResultDto = {
  confidencePercent?: number | undefined;
  flags?: string[] | undefined;
  overall: 'ok' | 'retry_suggested' | 'failed';
  retryReasons?: string[] | undefined;
};

export type VoiceInterpretationDto = {
  bullets: string[];
  disclaimerLine: string;
  headline: string;
};
