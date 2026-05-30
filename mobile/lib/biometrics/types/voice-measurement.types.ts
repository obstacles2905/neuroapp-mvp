import type {
  VoiceAcousticSnapshot,
  VoiceComparison,
  VoiceCoreMetrics,
} from '@/lib/biometrics/types/voice-core-metrics.types';

/** Протокольный шаг MVP (удержание гласной + фиксированная фраза). */
export type VoiceProtocolStepKind = 'sustained_vowel_a' | 'fixed_phrase';

/** Продуктовый статус качества сессии. */
export type VoiceSessionQualityOverall = 'ok' | 'retry_suggested' | 'failed';

/** Тон списка истории (оформление). */
export type VoiceInterpretationTone = 'attention' | 'neutral' | 'positive';

/**
 * Продуктовые голосовые индексы 0–100.
 * Направления:
 * — throatTensionScore / tremorScore / monotonicityScore: выше = выраженнее маркеры напряжения / дрожания / монотонности (вероятностная подсказка, не диагноз).
 * — confidenceScore: выше = больше устойчивости темпа и сигнала по правилам MVP.
 * — emotionalActivationScore: выше = выше энергетическая вариативность по правилам MVP (не «клиническая активация»).
 * — vocalStabilityScore: выше = стабильнее голос по правилам MVP (ресурсный маркер).
 */
export interface VoiceProductMetrics {
  throatTensionScore: number;
  tremorScore: number;
  confidenceScore: number;
  monotonicityScore: number;
  emotionalActivationScore: number;
  vocalStabilityScore: number;
}

/** Флаги и текстовые причины повтора записи (quality gates). */
export interface VoiceQualityResult {
  overall: VoiceSessionQualityOverall;
  /** 0–100: техническая уверенность в оценке (агрегат качества записи и полноты признаков). */
  confidencePercent?: number | undefined;
  flags?: string[] | undefined;
  retryReasons?: string[] | undefined;
}

/** Один завершённый фрагмент записи + наблюдаемые признаки на клиенте. */
export interface VoiceRecordingObservationSegment {
  kind: VoiceProtocolStepKind;
  durationMs: number;
  meteringSamples: readonly number[];
  uri?: string | undefined;
}

/** Интерпретация для пользователя (без медицинских утверждений). */
export interface VoiceSessionInterpretation {
  bullets: string[];
  disclaimerLine: string;
  headline: string;
}

export interface VoiceMeasurementSession {
  id: string;
  capturedAt: string;
  protocolVersion: string;
  extractorId: 'opensmile';
  extractorVersion: string;
  featureSet: 'eGeMAPSv02' | 'ComParE_2016' | 'custom';
  scoringVersion: string;
  durationMs: number;
  quality: VoiceQualityResult;
  /** Три основные метрики (с scoring core-v1). */
  coreMetrics?: VoiceCoreMetrics | undefined;
  comparison?: VoiceComparison | undefined;
  acousticSnapshot?: VoiceAcousticSnapshot | undefined;
  /** Legacy-индексы для API и трендов; производные от core + eGeMAPS. */
  metrics: VoiceProductMetrics;
  interpretation?: VoiceSessionInterpretation | undefined;
}

export type VoicePipelineFailureReason =
  | 'microphone_denied'
  | 'recording_failed'
  | 'extractor_failed'
  | 'quality_gate_failed';

export interface VoicePipelineFailure {
  failureReason: VoicePipelineFailureReason;
  retryHints?: string[] | undefined;
}
