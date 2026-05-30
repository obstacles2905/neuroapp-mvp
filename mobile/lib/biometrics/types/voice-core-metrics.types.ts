import type {
  VoiceStressLevel,
  VoiceVsiComparison,
} from '@/lib/biometrics/types/voice-stress-index.types';

/** Профиль высоты голоса в замере (не «норма человека»). */
export type VoicePitchProfile = 'low' | 'mid' | 'high';

/** Уровень дрожания по акустике. */
export type VoiceTremorLevel = 'low' | 'moderate' | 'elevated';

/** Уровень монотонности: выше индекс — ровнее/площе интонация. */
export type VoiceMonotonyLevel = 'expressive' | 'balanced' | 'flat';

export type VoiceComparisonMode = 'first_session_anchor' | 'personal_baseline';

export type VoiceTremorComparison =
  | 'below_usual'
  | 'typical'
  | 'above_usual'
  | 'low_in_recording'
  | 'moderate_in_recording'
  | 'elevated_in_recording';

export type VoiceMonotonyComparison =
  | 'below_usual'
  | 'typical'
  | 'above_usual'
  | 'expressive_in_recording'
  | 'balanced_in_recording'
  | 'flat_in_recording';

export type VoicePitchComparison =
  | 'unchanged'
  | 'higher_than_usual'
  | 'lower_than_usual'
  | 'profile_low'
  | 'profile_mid'
  | 'profile_high';

/** Три продуктовые метрики + VSI + числовые индексы 0–100. */
export interface VoiceCoreMetrics {
  monotonyIndex: number;
  monotonyLevel: VoiceMonotonyLevel;
  pitchProfile: VoicePitchProfile;
  pitchScore: number;
  shimmerScore: number;
  tremorIndex: number;
  tremorLevel: VoiceTremorLevel;
  voiceStressIndex: number;
  voiceStressLevel: VoiceStressLevel;
}

/** Базовые маркеры до расчёта VSI. */
export type VoiceCoreMetricsBase = Omit<
  VoiceCoreMetrics,
  'shimmerScore' | 'voiceStressIndex' | 'voiceStressLevel'
>;

/** Сырые якоря для пересчёта и персонального baseline. */
export interface VoiceAcousticSnapshot {
  f0SemitoneMean?: number | undefined;
  f0SemitoneRange: number;
  hnrDb?: number | undefined;
  jitter: number;
  loudnessStddevNorm: number;
  shimmer: number;
  source: 'egemaps' | 'metering_proxy';
}

export interface VoiceComparison {
  mode: VoiceComparisonMode;
  monotony: VoiceMonotonyComparison;
  pitch: VoicePitchComparison;
  sessionsInBaseline: number;
  tremor: VoiceTremorComparison;
  vsi: VoiceVsiComparison;
}

/** Медианы сырых eGeMAPS для нормировки VSI. */
export interface VoiceAcousticBaselineMedians {
  f0SemitoneMeanMedian?: number | undefined;
  f0SemitoneRangeMedian: number;
  jitterMedian: number;
  loudnessStddevNormMedian: number;
  shimmerMedian: number;
}

/** Медианы по прошлым OK-сессиям пользователя. */
export interface VoicePersonalBaseline {
  acoustic: VoiceAcousticBaselineMedians;
  monotonyIndexMedian: number;
  pitchScoreMedian: number;
  sessionCount: number;
  tremorIndexMedian: number;
  voiceStressIndexMedian: number;
}
