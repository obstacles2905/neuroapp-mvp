import {
  EGEMAPS_F0_RANGE_ACTIVATION_SCALE,
  EGEMAPS_F0_RANGE_MONOTONY_SCALE,
  EGEMAPS_F0_RANGE_TENSION_SCALE,
  EGEMAPS_JITTER_TENSION_SCALE,
  EGEMAPS_JITTER_TREMOR_SCALE,
  EGEMAPS_LOUDNESS_STD_ACTIVATION_SCALE,
  EGEMAPS_LOUDNESS_STD_MONOTONY_SCALE,
  EGEMAPS_LOUDNESS_STD_TENSION_SCALE,
  EGEMAPS_SHIMMER_TENSION_SCALE,
} from '@/lib/biometrics/constants/egemaps-scoring.constants';
import {
  extractEgmapsAcousticSignals,
  hasUsableEgmapsSignals,
} from '@/lib/biometrics/helpers/egemaps-functional-keys.helper';
import {
  isBrokenEgmapsCsvShape,
  mergeEgMapsSegments,
  rowsWithEgmaps,
} from '@/lib/biometrics/helpers/merge-egemaps-segments.helper';
import type { OpensmileLowLevelFeatureSnapshot } from '@/lib/biometrics/voice/opensmile-feature-extractor';
import type { VoiceProductMetrics } from '@/lib/biometrics/types/voice-measurement.types';

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function averageEnergyCv(rows: readonly OpensmileLowLevelFeatureSnapshot[]): number {
  if (rows.length === 0) {
    return 0;
  }
  const sum = rows.reduce((a, r) => a + r.energyCoefficientOfVariation, 0);
  return sum / rows.length;
}

function averageSilence(rows: readonly OpensmileLowLevelFeatureSnapshot[]): number {
  if (rows.length === 0) {
    return 1;
  }
  return rows.reduce((a, r) => a + r.silenceRatio, 0) / rows.length;
}

function maxClipping(rows: readonly OpensmileLowLevelFeatureSnapshot[]): number {
  let m = 0;
  for (const r of rows) {
    m = Math.max(m, r.clippingRunMax);
  }
  return m;
}

/**
 * Rule-based скоринг по eGeMAPS: имена колонок сопоставляются явно (см. egemaps-functional-keys.helper).
 */
export function computeVoiceProductMetricsFromEgmapsMerged(
  merged: Record<string, number>,
  phraseFeatures?: Record<string, number> | undefined,
  meteringFallbackRows?: readonly OpensmileLowLevelFeatureSnapshot[],
): VoiceProductMetrics {
  const signals = extractEgmapsAcousticSignals(merged, phraseFeatures);
  const featureColumnCount = Object.keys(merged).length;

  if (!hasUsableEgmapsSignals(signals, featureColumnCount)) {
    if (meteringFallbackRows != null && meteringFallbackRows.length > 0) {
      return computeVoiceProductMetricsFromMeteringFallback(meteringFallbackRows);
    }
  }

  const { jitter, shimmer, hnrDb, f0SemitoneRange, loudnessStddevNorm } = signals;

  const throatTensionScore = clampScore(
    jitter * EGEMAPS_JITTER_TENSION_SCALE +
      shimmer * EGEMAPS_SHIMMER_TENSION_SCALE +
      loudnessStddevNorm * EGEMAPS_LOUDNESS_STD_TENSION_SCALE +
      f0SemitoneRange * EGEMAPS_F0_RANGE_TENSION_SCALE,
  );

  const tremorScore = clampScore(
    jitter * EGEMAPS_JITTER_TREMOR_SCALE +
      shimmer * (EGEMAPS_SHIMMER_TENSION_SCALE * 0.6) +
      loudnessStddevNorm * (EGEMAPS_LOUDNESS_STD_TENSION_SCALE * 0.35),
  );

  const hnrNorm =
    hnrDb !== undefined && Number.isFinite(hnrDb)
      ? Math.min(1, Math.max(0, (hnrDb + 2) / 22))
      : 0.5;

  const vocalStabilityScore = clampScore(
    88 -
      throatTensionScore * 0.38 -
      tremorScore * 0.32 -
      (1 - hnrNorm) * 24 -
      loudnessStddevNorm * 14,
  );

  const confidenceScore = clampScore(
    70 + hnrNorm * 28 - jitter * 900 - tremorScore * 0.2 - loudnessStddevNorm * 8,
  );

  const emotionalActivationScore = clampScore(
    Math.min(
      100,
      loudnessStddevNorm * EGEMAPS_LOUDNESS_STD_ACTIVATION_SCALE +
        f0SemitoneRange * EGEMAPS_F0_RANGE_ACTIVATION_SCALE +
        (1 - hnrNorm) * 18,
    ),
  );

  const monotonicityScore = clampScore(
    100 -
      Math.min(
        100,
        f0SemitoneRange * EGEMAPS_F0_RANGE_MONOTONY_SCALE +
          loudnessStddevNorm * EGEMAPS_LOUDNESS_STD_MONOTONY_SCALE +
          jitter * 400,
      ),
  );

  return {
    confidenceScore,
    emotionalActivationScore,
    monotonicityScore,
    throatTensionScore,
    tremorScore,
    vocalStabilityScore,
  };
}

function computeFromEgmapsRows(rows: readonly OpensmileLowLevelFeatureSnapshot[]): VoiceProductMetrics {
  const withMaps = rowsWithEgmaps(rows);
  const merged = mergeEgMapsSegments(withMaps);
  if (isBrokenEgmapsCsvShape(merged)) {
    return computeVoiceProductMetricsFromMeteringFallback(rows);
  }
  const phrase = withMaps.find((r) => r.kind === 'fixed_phrase')?.gemapsFunctionals;
  return computeVoiceProductMetricsFromEgmapsMerged(merged, phrase, rows);
}

function computeVoiceProductMetricsFromMeteringFallback(
  rows: readonly OpensmileLowLevelFeatureSnapshot[],
): VoiceProductMetrics {
  const cv = averageEnergyCv(rows);
  const silence = averageSilence(rows);
  const clipRun = maxClipping(rows);

  const jitterProxy = clampScore(cv * 140);
  const tremorProxy = clampScore(cv * 110 + clipRun * 4);
  const monotonyProxy = clampScore(72 - Math.min(72, cv * 95));

  const throatTensionScore = clampScore(jitterProxy * 0.55 + tremorProxy * 0.45);
  const tremorScore = tremorProxy;

  const stabilityBase = 100 - (jitterProxy * 0.5 + tremorProxy * 0.35 + silence * 45);
  const vocalStabilityScore = clampScore(stabilityBase);

  const confidenceScore = clampScore(92 - silence * 65 - clipRun * 3);

  const emotionalActivationScore = clampScore(
    Math.min(100, cv * 85 + (1 - silence) * 28),
  );

  const monotonicityScore = monotonyProxy;

  return {
    confidenceScore,
    emotionalActivationScore,
    monotonicityScore,
    throatTensionScore,
    tremorScore,
    vocalStabilityScore,
  };
}

/**
 * Rule-based MVP: eGeMAPS (Android + openSMILE) или прокси по metering.
 */
export function computeVoiceProductMetrics(
  rows: readonly OpensmileLowLevelFeatureSnapshot[],
): VoiceProductMetrics {
  if (
    rows.length > 0 &&
    rows.every(
      (r) => r.gemapsFunctionals != null && Object.keys(r.gemapsFunctionals).length > 0,
    )
  ) {
    return computeFromEgmapsRows(rows);
  }

  return computeVoiceProductMetricsFromMeteringFallback(rows);
}
