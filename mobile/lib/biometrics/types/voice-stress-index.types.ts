/** Уровень напряжённости голоса (VSI). */
export type VoiceStressLevel = 'low' | 'moderate' | 'elevated';

export type VoiceVsiComparison =
  | 'below_usual'
  | 'typical'
  | 'above_usual'
  | 'low_in_recording'
  | 'moderate_in_recording'
  | 'elevated_in_recording';

/** Субиндексы 0–1 перед взвешиванием (для отладки / аналитики). */
export interface VoiceStressSubindices {
  jitter: number;
  f0Range: number;
  shimmer: number;
  f0Mean: number;
  loudnessStd: number;
}

export interface VoiceStressIndexResult {
  level: VoiceStressLevel;
  subindices: VoiceStressSubindices;
  voiceStressIndex: number;
}
