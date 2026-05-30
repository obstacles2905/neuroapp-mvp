import type { VoiceCoreMetrics } from '@/lib/biometrics/types/voice-core-metrics.types';
import type { VoiceProductMetrics } from '@/lib/biometrics/types/voice-measurement.types';

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Legacy-поля API: VSI + разбор по маркерам (обратная совместимость sync). */
export function deriveLegacyVoiceMetrics(core: VoiceCoreMetrics): VoiceProductMetrics {
  const throatTensionScore = core.voiceStressIndex;
  const vocalStabilityScore = clampScore(
    100 - core.tremorIndex * 0.42 - core.monotonyIndex * 0.18,
  );
  const confidenceScore = clampScore(88 - core.tremorIndex * 0.38 - core.monotonyIndex * 0.08);
  const emotionalActivationScore = clampScore(
    Math.min(100, (100 - core.monotonyIndex) * 0.55 + core.tremorIndex * 0.12),
  );

  return {
    confidenceScore,
    emotionalActivationScore,
    monotonicityScore: core.monotonyIndex,
    throatTensionScore,
    tremorScore: core.tremorIndex,
    vocalStabilityScore,
  };
}
