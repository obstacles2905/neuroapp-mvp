import type { VoicePersonalBaseline } from '@/lib/biometrics/types/voice-core-metrics.types';
import type { VoiceAcousticSnapshot } from '@/lib/biometrics/types/voice-core-metrics.types';
import type { VoiceCoreMetrics } from '@/lib/biometrics/types/voice-core-metrics.types';
import {
  computeShimmerScore,
  computeVoiceStressIndex,
} from '@/lib/biometrics/voice/compute-voice-stress-index';

export function enrichVoiceCoreWithStress(input: {
  acousticSnapshot: VoiceAcousticSnapshot;
  coreWithoutStress: Omit<
    VoiceCoreMetrics,
    'shimmerScore' | 'voiceStressIndex' | 'voiceStressLevel'
  >;
  personalBaseline: VoicePersonalBaseline | null;
}): VoiceCoreMetrics {
  const shimmerScore = computeShimmerScore(input.acousticSnapshot.shimmer);
  const partial: VoiceCoreMetrics = {
    ...input.coreWithoutStress,
    shimmerScore,
    voiceStressIndex: 0,
    voiceStressLevel: 'low',
  };

  const stress = computeVoiceStressIndex({
    acousticSnapshot: input.acousticSnapshot,
    coreMetrics: partial,
    personalBaseline: input.personalBaseline,
  });

  return {
    ...partial,
    voiceStressIndex: stress.voiceStressIndex,
    voiceStressLevel: stress.level,
  };
}
