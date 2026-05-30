import {
  VSI_ANCHOR_F0_MEAN_STRESS_SEMITONES,
  VSI_ANCHOR_F0_RANGE_MIN,
  VSI_ANCHOR_JITTER_MAX,
  VSI_ANCHOR_LOUDNESS_STD_MAX,
  VSI_ANCHOR_SHIMMER_MAX,
  VSI_BASELINE_SPREAD_RATIO,
  VSI_LEVEL_ELEVATED_MIN,
  VSI_LEVEL_MODERATE_MIN,
  VSI_MIN_RAW_SPREAD_F0_MEAN,
  VSI_MIN_RAW_SPREAD_F0_RANGE,
  VSI_MIN_RAW_SPREAD_JITTER,
  VSI_MIN_RAW_SPREAD_LOUDNESS,
  VSI_MIN_RAW_SPREAD_SHIMMER,
  VSI_WEIGHT_F0_MEAN,
  VSI_WEIGHT_F0_RANGE,
  VSI_WEIGHT_JITTER,
  VSI_WEIGHT_LOUDNESS_STD,
  VSI_WEIGHT_SHIMMER,
} from '@/lib/biometrics/constants/voice-stress-index.constants';
import { VOICE_TREMOR_SHIMMER_WEIGHT } from '@/lib/biometrics/constants/voice-core-metrics.constants';
import {
  stressSubindexHigherIsWorse,
  stressSubindexLinearHigh,
  stressSubindexLinearLow,
  stressSubindexLowerIsWorse,
} from '@/lib/biometrics/helpers/normalize-voice-stress-subindex.helper';
import type { VoiceAcousticSnapshot } from '@/lib/biometrics/types/voice-core-metrics.types';
import type { VoicePersonalBaseline } from '@/lib/biometrics/types/voice-core-metrics.types';
import type { VoiceCoreMetrics } from '@/lib/biometrics/types/voice-core-metrics.types';
import type {
  VoiceStressIndexResult,
  VoiceStressLevel,
  VoiceStressSubindices,
} from '@/lib/biometrics/types/voice-stress-index.types';

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function resolveStressLevel(vsi: number): VoiceStressLevel {
  if (vsi >= VSI_LEVEL_ELEVATED_MIN) {
    return 'elevated';
  }
  if (vsi >= VSI_LEVEL_MODERATE_MIN) {
    return 'moderate';
  }
  return 'low';
}

function spreadFromBaseline(baseline: number, minSpread: number): number {
  return Math.max(Math.abs(baseline) * VSI_BASELINE_SPREAD_RATIO, minSpread);
}

function computeShimmerScore(shimmer: number): number {
  return clampScore(shimmer * VOICE_TREMOR_SHIMMER_WEIGHT * 12);
}

function buildSubindicesFromBaseline(
  snapshot: VoiceAcousticSnapshot,
  baseline: VoicePersonalBaseline,
): VoiceStressSubindices {
  const ac = baseline.acoustic;
  const f0Mean = snapshot.f0SemitoneMean ?? ac.f0SemitoneMeanMedian ?? 0;

  const sJitter = stressSubindexHigherIsWorse(
    snapshot.jitter,
    ac.jitterMedian,
    spreadFromBaseline(ac.jitterMedian, VSI_MIN_RAW_SPREAD_JITTER),
  );

  const sShimmer = stressSubindexHigherIsWorse(
    snapshot.shimmer,
    ac.shimmerMedian,
    spreadFromBaseline(ac.shimmerMedian, VSI_MIN_RAW_SPREAD_SHIMMER),
  );

  const sF0Range = stressSubindexLowerIsWorse(
    snapshot.f0SemitoneRange,
    ac.f0SemitoneRangeMedian,
    spreadFromBaseline(ac.f0SemitoneRangeMedian, VSI_MIN_RAW_SPREAD_F0_RANGE),
  );

  const f0Baseline = ac.f0SemitoneMeanMedian ?? f0Mean;
  const sF0Mean = stressSubindexHigherIsWorse(
    f0Mean,
    f0Baseline,
    spreadFromBaseline(f0Baseline, VSI_MIN_RAW_SPREAD_F0_MEAN),
  );

  const sLoudnessHigh = stressSubindexHigherIsWorse(
    snapshot.loudnessStddevNorm,
    ac.loudnessStddevNormMedian,
    spreadFromBaseline(ac.loudnessStddevNormMedian, VSI_MIN_RAW_SPREAD_LOUDNESS),
  );
  const sLoudnessLow = stressSubindexLowerIsWorse(
    snapshot.loudnessStddevNorm,
    ac.loudnessStddevNormMedian,
    spreadFromBaseline(ac.loudnessStddevNormMedian, VSI_MIN_RAW_SPREAD_LOUDNESS),
  );
  const sLoudness = Math.max(sLoudnessHigh, sLoudnessLow);

  return {
    f0Mean: sF0Mean,
    f0Range: sF0Range,
    jitter: sJitter,
    loudnessStd: sLoudness,
    shimmer: sShimmer,
  };
}

function buildSubindicesFromAnchor(
  snapshot: VoiceAcousticSnapshot,
  _core: VoiceCoreMetrics,
): VoiceStressSubindices {
  const f0Mean = snapshot.f0SemitoneMean ?? 0;

  return {
    jitter: stressSubindexLinearHigh(snapshot.jitter, 0, VSI_ANCHOR_JITTER_MAX),
    f0Range: stressSubindexLinearLow(
      snapshot.f0SemitoneRange,
      VSI_ANCHOR_F0_RANGE_MIN,
      VSI_ANCHOR_F0_RANGE_MIN + 12,
    ),
    shimmer: stressSubindexLinearHigh(snapshot.shimmer, 0, VSI_ANCHOR_SHIMMER_MAX),
    f0Mean: stressSubindexLinearHigh(
      f0Mean,
      18,
      VSI_ANCHOR_F0_MEAN_STRESS_SEMITONES,
    ),
    loudnessStd: stressSubindexLinearHigh(
      snapshot.loudnessStddevNorm,
      0,
      VSI_ANCHOR_LOUDNESS_STD_MAX,
    ),
  };
}

function synthesizeVsi(sub: VoiceStressSubindices): number {
  const cumulative =
    sub.jitter * VSI_WEIGHT_JITTER +
    sub.f0Range * VSI_WEIGHT_F0_RANGE +
    sub.shimmer * VSI_WEIGHT_SHIMMER +
    sub.f0Mean * VSI_WEIGHT_F0_MEAN +
    sub.loudnessStd * VSI_WEIGHT_LOUDNESS_STD;

  return clampScore(cumulative * 100);
}

export function computeVoiceStressIndex(input: {
  acousticSnapshot: VoiceAcousticSnapshot;
  coreMetrics: VoiceCoreMetrics;
  personalBaseline: VoicePersonalBaseline | null;
}): VoiceStressIndexResult {
  const { acousticSnapshot, coreMetrics, personalBaseline } = input;

  const subindices =
    personalBaseline != null
      ? buildSubindicesFromBaseline(acousticSnapshot, personalBaseline)
      : buildSubindicesFromAnchor(acousticSnapshot, coreMetrics);

  const voiceStressIndex = synthesizeVsi(subindices);

  return {
    level: resolveStressLevel(voiceStressIndex),
    subindices,
    voiceStressIndex,
  };
}

export { computeShimmerScore };
