import {
  VOICE_BASELINE_MAX_SESSIONS,
  VOICE_BASELINE_MIN_SESSIONS,
} from '@/lib/biometrics/constants/voice-core-metrics.constants';
import { medianOfNumbers } from '@/lib/biometrics/helpers/median-numbers.helper';
import type { VoicePersonalBaseline } from '@/lib/biometrics/types/voice-core-metrics.types';
import type { VoiceMeasurementSession } from '@/lib/biometrics/types/voice-measurement.types';
import {
  loadPersistedVoiceSession,
  loadVoiceSessionHistoriesNewestFirst,
} from '@/lib/biometrics/voice/voice-session-history.store';

async function loadBaselineSessions(
  excludeSessionId: string,
): Promise<VoiceMeasurementSession[]> {
  const items = await loadVoiceSessionHistoriesNewestFirst();
  const sessions: VoiceMeasurementSession[] = [];
  for (const item of items) {
    if (item.sessionId === excludeSessionId) {
      continue;
    }
    const record = await loadPersistedVoiceSession(item.sessionId);
    if (record == null) {
      continue;
    }
    const result = record.result;
    if (result.quality.overall !== 'ok') {
      continue;
    }
    if (
      result.coreMetrics?.voiceStressIndex === undefined ||
      result.acousticSnapshot == null
    ) {
      continue;
    }
    sessions.push(result);
    if (sessions.length >= VOICE_BASELINE_MAX_SESSIONS) {
      break;
    }
  }
  return sessions;
}

export async function loadVoicePersonalBaseline(
  excludeSessionId: string,
): Promise<VoicePersonalBaseline | null> {
  const sessions = await loadBaselineSessions(excludeSessionId);
  if (sessions.length < VOICE_BASELINE_MIN_SESSIONS) {
    return null;
  }

  const tremorValues = sessions.map((s) => s.coreMetrics!.tremorIndex);
  const monotonyValues = sessions.map((s) => s.coreMetrics!.monotonyIndex);
  const pitchValues = sessions.map((s) => s.coreMetrics!.pitchScore);
  const vsiValues = sessions.map((s) => s.coreMetrics!.voiceStressIndex);

  const jitterValues = sessions.map((s) => s.acousticSnapshot!.jitter);
  const shimmerValues = sessions.map((s) => s.acousticSnapshot!.shimmer);
  const rangeValues = sessions.map((s) => s.acousticSnapshot!.f0SemitoneRange);
  const loudnessValues = sessions.map((s) => s.acousticSnapshot!.loudnessStddevNorm);
  const f0MeanValues = sessions
    .map((s) => s.acousticSnapshot!.f0SemitoneMean)
    .filter((v): v is number => v !== undefined && Number.isFinite(v));

  const tremorIndexMedian = medianOfNumbers(tremorValues);
  const monotonyIndexMedian = medianOfNumbers(monotonyValues);
  const pitchScoreMedian = medianOfNumbers(pitchValues);
  const voiceStressIndexMedian = medianOfNumbers(vsiValues);
  const jitterMedian = medianOfNumbers(jitterValues);
  const shimmerMedian = medianOfNumbers(shimmerValues);
  const f0SemitoneRangeMedian = medianOfNumbers(rangeValues);
  const loudnessStddevNormMedian = medianOfNumbers(loudnessValues);
  const f0SemitoneMeanMedian = medianOfNumbers(f0MeanValues);

  if (
    tremorIndexMedian === undefined ||
    monotonyIndexMedian === undefined ||
    pitchScoreMedian === undefined ||
    voiceStressIndexMedian === undefined ||
    jitterMedian === undefined ||
    shimmerMedian === undefined ||
    f0SemitoneRangeMedian === undefined ||
    loudnessStddevNormMedian === undefined
  ) {
    return null;
  }

  return {
    acoustic: {
      f0SemitoneMeanMedian,
      f0SemitoneRangeMedian,
      jitterMedian,
      loudnessStddevNormMedian,
      shimmerMedian,
    },
    monotonyIndexMedian,
    pitchScoreMedian,
    sessionCount: sessions.length,
    tremorIndexMedian,
    voiceStressIndexMedian,
  };
}
