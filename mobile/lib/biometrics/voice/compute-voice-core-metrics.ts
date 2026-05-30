import {
  VOICE_METERING_MONOTONY_CV_WEIGHT,
  VOICE_METERING_TREMOR_CV_WEIGHT,
  VOICE_MONOTONY_ANCHOR_BALANCED_MIN,
  VOICE_MONOTONY_ANCHOR_FLAT_MIN,
  VOICE_MONOTONY_F0_RANGE_WEIGHT,
  VOICE_MONOTONY_LEVEL_BALANCED_MIN,
  VOICE_MONOTONY_LEVEL_FLAT_MIN,
  VOICE_MONOTONY_LOUDNESS_STD_WEIGHT,
  VOICE_PITCH_SCORE_SEMITONE_MAX,
  VOICE_PITCH_SCORE_SEMITONE_MIN,
  VOICE_PITCH_SEMITONE_HIGH_MIN,
  VOICE_PITCH_SEMITONE_LOW_MAX,
  VOICE_TREMOR_HNR_PENALTY_WEIGHT,
  VOICE_TREMOR_JITTER_WEIGHT,
  VOICE_TREMOR_LEVEL_ELEVATED_MIN,
  VOICE_TREMOR_LEVEL_MODERATE_MIN,
  VOICE_TREMOR_SHIMMER_WEIGHT,
} from '@/lib/biometrics/constants/voice-core-metrics.constants';
import {
  extractEgmapsAcousticSignals,
  hasUsableEgmapsSignals,
  type EgmapsAcousticSignals,
} from '@/lib/biometrics/helpers/egemaps-functional-keys.helper';
import {
  isBrokenEgmapsCsvShape,
  mergeEgMapsSegments,
  rowsWithEgmaps,
} from '@/lib/biometrics/helpers/merge-egemaps-segments.helper';
import type {
  VoiceAcousticSnapshot,
  VoiceCoreMetricsBase,
  VoiceMonotonyLevel,
  VoicePitchProfile,
  VoiceTremorLevel,
} from '@/lib/biometrics/types/voice-core-metrics.types';
import type { OpensmileLowLevelFeatureSnapshot } from '@/lib/biometrics/voice/opensmile-feature-extractor';

export interface VoiceCoreMetricsResult {
  acousticSnapshot: VoiceAcousticSnapshot;
  coreMetricsBase: VoiceCoreMetricsBase;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function averageEnergyCv(rows: readonly OpensmileLowLevelFeatureSnapshot[]): number {
  if (rows.length === 0) {
    return 0;
  }
  return rows.reduce((a, r) => a + r.energyCoefficientOfVariation, 0) / rows.length;
}

function blendSignals(
  vowel: EgmapsAcousticSignals | null,
  phrase: EgmapsAcousticSignals | null,
): EgmapsAcousticSignals {
  const v = vowel;
  const p = phrase ?? vowel;
  if (p == null && v == null) {
    return {
      equivalentSoundLevelDb: undefined,
      f0SemitoneMean: undefined,
      f0SemitoneRange: 0,
      hnrDb: undefined,
      jitter: 0,
      loudnessMean: 0,
      loudnessStddevNorm: 0,
      shimmer: 0,
    };
  }
  if (v == null) {
    return p!;
  }
  if (p == null) {
    return v;
  }
  const tremorWeightVowel = 0.72;
  const tremorWeightPhrase = 0.28;
  return {
    equivalentSoundLevelDb: p.equivalentSoundLevelDb ?? v.equivalentSoundLevelDb,
    f0SemitoneMean: p.f0SemitoneMean ?? v.f0SemitoneMean,
    f0SemitoneRange: p.f0SemitoneRange,
    hnrDb: v.hnrDb ?? p.hnrDb,
    jitter: v.jitter * tremorWeightVowel + p.jitter * tremorWeightPhrase,
    loudnessMean: p.loudnessMean,
    loudnessStddevNorm: p.loudnessStddevNorm,
    shimmer: v.shimmer * tremorWeightVowel + p.shimmer * tremorWeightPhrase,
  };
}

function signalsToSnapshot(
  signals: EgmapsAcousticSignals,
  source: VoiceAcousticSnapshot['source'],
): VoiceAcousticSnapshot {
  return {
    f0SemitoneMean: signals.f0SemitoneMean,
    f0SemitoneRange: signals.f0SemitoneRange,
    hnrDb: signals.hnrDb,
    jitter: signals.jitter,
    loudnessStddevNorm: signals.loudnessStddevNorm,
    shimmer: signals.shimmer,
    source,
  };
}

function resolvePitchProfile(f0Mean: number | undefined): VoicePitchProfile {
  if (f0Mean === undefined || !Number.isFinite(f0Mean)) {
    return 'mid';
  }
  if (f0Mean < VOICE_PITCH_SEMITONE_LOW_MAX) {
    return 'low';
  }
  if (f0Mean >= VOICE_PITCH_SEMITONE_HIGH_MIN) {
    return 'high';
  }
  return 'mid';
}

function computePitchScore(f0Mean: number | undefined): number {
  if (f0Mean === undefined || !Number.isFinite(f0Mean)) {
    return 50;
  }
  const span = VOICE_PITCH_SCORE_SEMITONE_MAX - VOICE_PITCH_SCORE_SEMITONE_MIN;
  const normalized = (f0Mean - VOICE_PITCH_SCORE_SEMITONE_MIN) / span;
  return clampScore(normalized * 100);
}

function hnrPenalty(hnrDb: number | undefined): number {
  if (hnrDb === undefined || !Number.isFinite(hnrDb)) {
    return 0;
  }
  const norm = Math.min(1, Math.max(0, (hnrDb + 2) / 22));
  return (1 - norm) * VOICE_TREMOR_HNR_PENALTY_WEIGHT;
}

function computeTremorIndex(signals: EgmapsAcousticSignals): number {
  return clampScore(
    signals.jitter * VOICE_TREMOR_JITTER_WEIGHT +
      signals.shimmer * VOICE_TREMOR_SHIMMER_WEIGHT +
      hnrPenalty(signals.hnrDb),
  );
}

function resolveTremorLevel(index: number): VoiceTremorLevel {
  if (index >= VOICE_TREMOR_LEVEL_ELEVATED_MIN) {
    return 'elevated';
  }
  if (index >= VOICE_TREMOR_LEVEL_MODERATE_MIN) {
    return 'moderate';
  }
  return 'low';
}

function computeMonotonyIndex(signals: EgmapsAcousticSignals): number {
  const variability =
    signals.f0SemitoneRange * VOICE_MONOTONY_F0_RANGE_WEIGHT +
    signals.loudnessStddevNorm * VOICE_MONOTONY_LOUDNESS_STD_WEIGHT;
  return clampScore(100 - Math.min(100, variability));
}

function resolveMonotonyLevel(index: number): VoiceMonotonyLevel {
  if (index >= VOICE_MONOTONY_LEVEL_FLAT_MIN) {
    return 'flat';
  }
  if (index >= VOICE_MONOTONY_LEVEL_BALANCED_MIN) {
    return 'balanced';
  }
  return 'expressive';
}

function buildCoreFromSignals(signals: EgmapsAcousticSignals): VoiceCoreMetricsBase {
  const tremorIndex = computeTremorIndex(signals);
  const monotonyIndex = computeMonotonyIndex(signals);
  return {
    monotonyIndex,
    monotonyLevel: resolveMonotonyLevel(monotonyIndex),
    pitchProfile: resolvePitchProfile(signals.f0SemitoneMean),
    pitchScore: computePitchScore(signals.f0SemitoneMean),
    tremorIndex,
    tremorLevel: resolveTremorLevel(tremorIndex),
  };
}

function computeFromMetering(rows: readonly OpensmileLowLevelFeatureSnapshot[]): VoiceCoreMetricsResult {
  const cv = averageEnergyCv(rows);
  const tremorIndex = clampScore(cv * VOICE_METERING_TREMOR_CV_WEIGHT);
  const monotonyIndex = clampScore(100 - Math.min(100, cv * VOICE_METERING_MONOTONY_CV_WEIGHT));
  const snapshot: VoiceAcousticSnapshot = {
    f0SemitoneRange: 0,
    jitter: cv,
    loudnessStddevNorm: cv,
    shimmer: cv,
    source: 'metering_proxy',
  };
  const coreMetricsBase: VoiceCoreMetricsBase = {
    monotonyIndex,
    monotonyLevel: resolveMonotonyLevel(monotonyIndex),
    pitchProfile: 'mid',
    pitchScore: 50,
    tremorIndex,
    tremorLevel: resolveTremorLevel(tremorIndex),
  };
  return { acousticSnapshot: snapshot, coreMetricsBase };
}

function extractSegmentSignals(
  rows: readonly OpensmileLowLevelFeatureSnapshot[],
): { phrase: EgmapsAcousticSignals | null; vowel: EgmapsAcousticSignals | null } {
  const withMaps = rowsWithEgmaps(rows);
  const vowelRow = withMaps.find((r) => r.kind === 'sustained_vowel_a');
  const phraseRow = withMaps.find((r) => r.kind === 'fixed_phrase');
  const vowelMaps = vowelRow?.gemapsFunctionals;
  const phraseMaps = phraseRow?.gemapsFunctionals;
  const vowel =
    vowelMaps != null && Object.keys(vowelMaps).length > 0
      ? extractEgmapsAcousticSignals(vowelMaps, vowelMaps)
      : null;
  const phrase =
    phraseMaps != null && Object.keys(phraseMaps).length > 0
      ? extractEgmapsAcousticSignals(phraseMaps, phraseMaps)
      : null;
  return { phrase, vowel };
}

/**
 * Три продуктовые метрики + acoustic snapshot для baseline.
 */
export function computeVoiceCoreMetrics(
  rows: readonly OpensmileLowLevelFeatureSnapshot[],
): VoiceCoreMetricsResult {
  const withMaps = rowsWithEgmaps(rows);
  if (withMaps.length === 0) {
    return computeFromMetering(rows);
  }

  const merged = mergeEgMapsSegments(withMaps);
  if (isBrokenEgmapsCsvShape(merged)) {
    return computeFromMetering(rows);
  }

  const { phrase, vowel } = extractSegmentSignals(rows);
  const phraseMaps = withMaps.find((r) => r.kind === 'fixed_phrase')?.gemapsFunctionals;
  const mergedSignals = extractEgmapsAcousticSignals(merged, phraseMaps);
  const columnCount = Object.keys(merged).length;

  if (!hasUsableEgmapsSignals(mergedSignals, columnCount)) {
    return computeFromMetering(rows);
  }

  const blended = blendSignals(vowel, phrase);
  const snapshot = signalsToSnapshot(blended, 'egemaps');
  const coreMetricsBase = buildCoreFromSignals(blended);
  return { acousticSnapshot: snapshot, coreMetricsBase };
}
