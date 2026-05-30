export type VoicePitchProfileJson = 'low' | 'mid' | 'high';

export type VoiceTremorLevelJson = 'low' | 'moderate' | 'elevated';

export type VoiceMonotonyLevelJson = 'expressive' | 'balanced' | 'flat';

export interface IVoiceCoreMetricsJson {
  monotonyIndex: number;
  monotonyLevel: VoiceMonotonyLevelJson;
  pitchProfile: VoicePitchProfileJson;
  pitchScore: number;
  shimmerScore: number;
  tremorIndex: number;
  tremorLevel: VoiceTremorLevelJson;
  voiceStressIndex: number;
  voiceStressLevel: 'low' | 'moderate' | 'elevated';
}

export interface IVoiceAcousticSnapshotJson {
  f0SemitoneMean?: number | undefined;
  f0SemitoneRange: number;
  hnrDb?: number | undefined;
  jitter: number;
  loudnessStddevNorm: number;
  shimmer: number;
  source: 'egemaps' | 'metering_proxy';
}

export interface IVoiceComparisonJson {
  mode: 'first_session_anchor' | 'personal_baseline';
  monotony: string;
  pitch: string;
  sessionsInBaseline: number;
  tremor: string;
  vsi: string;
}

export interface IVoiceProductMetricsJson {
  confidenceScore: number;
  emotionalActivationScore: number;
  monotonicityScore: number;
  throatTensionScore: number;
  tremorScore: number;
  vocalStabilityScore: number;
}

export interface IVoiceQualityResultJson {
  confidencePercent?: number | undefined;
  flags?: string[] | undefined;
  overall: 'ok' | 'retry_suggested' | 'failed';
  retryReasons?: string[] | undefined;
}

export interface IVoiceInterpretationJson {
  bullets: string[];
  disclaimerLine: string;
  headline: string;
}
