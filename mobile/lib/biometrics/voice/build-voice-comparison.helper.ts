import {
  VOICE_BASELINE_DELTA_RATIO,
  VOICE_MONOTONY_ANCHOR_BALANCED_MIN,
  VOICE_MONOTONY_ANCHOR_FLAT_MIN,
  VOICE_TREMOR_ANCHOR_ELEVATED_MIN,
  VOICE_TREMOR_ANCHOR_MODERATE_MIN,
} from '@/lib/biometrics/constants/voice-core-metrics.constants';
import {
  VSI_ANCHOR_ELEVATED_MIN,
  VSI_ANCHOR_MODERATE_MIN,
} from '@/lib/biometrics/constants/voice-stress-index.constants';
import type {
  VoiceComparison,
  VoiceCoreMetrics,
  VoiceMonotonyComparison,
  VoiceMonotonyLevel,
  VoicePersonalBaseline,
  VoicePitchComparison,
  VoicePitchProfile,
  VoiceTremorComparison,
  VoiceTremorLevel,
} from '@/lib/biometrics/types/voice-core-metrics.types';

function relativeDelta(current: number, baseline: number): number {
  const denom = Math.max(Math.abs(baseline), 1);
  return (current - baseline) / denom;
}

function compareIndexToBaseline(
  current: number,
  baselineMedian: number,
): 'below_usual' | 'typical' | 'above_usual' {
  const delta = relativeDelta(current, baselineMedian);
  if (delta >= VOICE_BASELINE_DELTA_RATIO) {
    return 'above_usual';
  }
  if (delta <= -VOICE_BASELINE_DELTA_RATIO) {
    return 'below_usual';
  }
  return 'typical';
}

function anchorTremor(level: VoiceTremorLevel): VoiceTremorComparison {
  if (level === 'elevated') {
    return 'elevated_in_recording';
  }
  if (level === 'moderate') {
    return 'moderate_in_recording';
  }
  return 'low_in_recording';
}

function anchorMonotony(level: VoiceMonotonyLevel): VoiceMonotonyComparison {
  if (level === 'flat') {
    return 'flat_in_recording';
  }
  if (level === 'balanced') {
    return 'balanced_in_recording';
  }
  return 'expressive_in_recording';
}

function anchorPitch(profile: VoicePitchProfile): VoicePitchComparison {
  if (profile === 'high') {
    return 'profile_high';
  }
  if (profile === 'low') {
    return 'profile_low';
  }
  return 'profile_mid';
}

function buildFirstSessionComparison(core: VoiceCoreMetrics): VoiceComparison {
  const tremor =
    core.tremorIndex >= VOICE_TREMOR_ANCHOR_ELEVATED_MIN
      ? 'elevated_in_recording'
      : core.tremorIndex >= VOICE_TREMOR_ANCHOR_MODERATE_MIN
        ? 'moderate_in_recording'
        : 'low_in_recording';

  const monotony =
    core.monotonyIndex >= VOICE_MONOTONY_ANCHOR_FLAT_MIN
      ? 'flat_in_recording'
      : core.monotonyIndex >= VOICE_MONOTONY_ANCHOR_BALANCED_MIN
        ? 'balanced_in_recording'
        : 'expressive_in_recording';

  const vsi =
    core.voiceStressIndex >= VSI_ANCHOR_ELEVATED_MIN
      ? 'elevated_in_recording'
      : core.voiceStressIndex >= VSI_ANCHOR_MODERATE_MIN
        ? 'moderate_in_recording'
        : 'low_in_recording';

  return {
    mode: 'first_session_anchor',
    monotony,
    pitch: anchorPitch(core.pitchProfile),
    sessionsInBaseline: 0,
    tremor,
    vsi,
  };
}

function buildBaselineComparison(
  core: VoiceCoreMetrics,
  baseline: VoicePersonalBaseline,
): VoiceComparison {
  return {
    mode: 'personal_baseline',
    monotony: compareIndexToBaseline(core.monotonyIndex, baseline.monotonyIndexMedian),
    pitch: compareIndexToBaseline(core.pitchScore, baseline.pitchScoreMedian),
    sessionsInBaseline: baseline.sessionCount,
    tremor: compareIndexToBaseline(core.tremorIndex, baseline.tremorIndexMedian),
    vsi: compareIndexToBaseline(core.voiceStressIndex, baseline.voiceStressIndexMedian),
  };
}

export function buildVoiceComparison(
  core: VoiceCoreMetrics,
  baseline: VoicePersonalBaseline | null,
): VoiceComparison {
  if (baseline == null) {
    return buildFirstSessionComparison(core);
  }
  return buildBaselineComparison(core, baseline);
}
