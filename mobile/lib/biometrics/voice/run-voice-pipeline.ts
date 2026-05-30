import {
  VOICE_CLIPPING_RUN_SAMPLES,
  VOICE_EXTRACTOR_ID,
  VOICE_EXTRACTOR_VERSION_ANDROID,
  VOICE_EXTRACTOR_VERSION_STUB,
  VOICE_FEATURE_SET_EGEMAPS,
  VOICE_FEATURE_SET_STUB,
  VOICE_PHRASE_MAX_DURATION_MS,
  VOICE_PHRASE_MIN_DURATION_MS,
  VOICE_PROTOCOL_VERSION,
  VOICE_SCORING_VERSION,
  VOICE_SILENCE_RATIO_FAIL,
  VOICE_VOWEL_MAX_DURATION_MS,
  VOICE_VOWEL_MIN_DURATION_MS,
} from '@/lib/biometrics/constants/voice-capture.constants';
import type {
  VoiceMeasurementSession,
  VoicePipelineFailure,
  VoiceQualityResult,
  VoiceRecordingObservationSegment,
  VoiceSessionInterpretation,
  VoiceSessionQualityOverall,
} from '@/lib/biometrics/types/voice-measurement.types';
import {
  meteringCoefficientOfVariation,
  meteringMaxClippingRun,
  meteringSilenceRatio,
} from '@/lib/biometrics/voice/audio-capture.adapter';
import { buildVoiceComparison } from '@/lib/biometrics/voice/build-voice-comparison.helper';
import { buildVoiceInterpretation } from '@/lib/biometrics/voice/build-voice-interpretation.helper';
import { computeVoiceCoreMetrics } from '@/lib/biometrics/voice/compute-voice-core-metrics';
import { deriveLegacyVoiceMetrics } from '@/lib/biometrics/voice/derive-legacy-voice-metrics.helper';
import { enrichVoiceCoreWithStress } from '@/lib/biometrics/voice/enrich-voice-core-metrics.helper';
import { loadVoicePersonalBaseline } from '@/lib/biometrics/voice/voice-personal-baseline.helper';
import {
  extractEgmapsAcousticSignals,
  hasUsableEgmapsSignals,
} from '@/lib/biometrics/helpers/egemaps-functional-keys.helper';
import {
  extractEgmapsFunctional,
  isAndroidOpensmileNativeAvailable,
  transcodeRecordingToWav,
} from '@/lib/biometrics/voice/android-opensmile.bridge';
import {
  createStubOpensmileExtractor,
  type OpensmileLowLevelFeatureSnapshot,
  type VoiceOpensmileExtractor,
} from '@/lib/biometrics/voice/opensmile-feature-extractor';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

type SegmentGate = {
  flags: string[];
  retryReasons: string[];
};

function gateSegmentDuration(
  label: string,
  durationMs: number,
  minMs: number,
  maxMs: number,
): SegmentGate {
  if (durationMs < minMs) {
    return {
      flags: ['duration_short'],
      retryReasons: [`Слишком короткая запись (${label}).`],
    };
  }
  if (durationMs > maxMs) {
    return {
      flags: ['duration_long'],
      retryReasons: [`Запись слишком длинная (${label}), остановите раньше.`],
    };
  }
  return { flags: [], retryReasons: [] };
}

function gateMetering(row: VoiceRecordingObservationSegment): SegmentGate {
  const silence = meteringSilenceRatio(row.meteringSamples);
  const clipRun = meteringMaxClippingRun(row.meteringSamples);
  const flags: string[] = [];
  const retryReasons: string[] = [];
  if (row.meteringSamples.length < 8) {
    flags.push('low_metering_coverage');
  }
  if (silence >= VOICE_SILENCE_RATIO_FAIL) {
    flags.push('high_silence_ratio');
    retryReasons.push('Голос почти не слышен — говорите ближе к микрофону.');
  }
  if (clipRun >= VOICE_CLIPPING_RUN_SAMPLES) {
    flags.push('possible_clipping');
    retryReasons.push('Похоже на перегруз микрофона — отойдите чуть дальше или говорите тише.');
  }
  return { flags, retryReasons };
}

function mergeSegmentGates(a: SegmentGate, b: SegmentGate): SegmentGate {
  return {
    flags: [...a.flags, ...b.flags],
    retryReasons: [...a.retryReasons, ...b.retryReasons],
  };
}

function resolveOverallQuality(retryReasons: readonly string[]): VoiceSessionQualityOverall {
  if (retryReasons.length === 0) {
    return 'ok';
  }
  return 'retry_suggested';
}

function computeConfidencePercent(flags: readonly string[]): number {
  let penalty = 0;
  for (const f of flags) {
    if (f === 'low_metering_coverage') {
      penalty += 12;
    }
    if (f === 'high_silence_ratio') {
      penalty += 35;
    }
    if (f === 'possible_clipping') {
      penalty += 22;
    }
    if (f === 'duration_short' || f === 'duration_long') {
      penalty += 18;
    }
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}

function buildSnapshots(
  segments: readonly VoiceRecordingObservationSegment[],
): OpensmileLowLevelFeatureSnapshot[] {
  return segments.map((seg) => ({
    clippingRunMax: meteringMaxClippingRun(seg.meteringSamples),
    durationMs: seg.durationMs,
    energyCoefficientOfVariation: meteringCoefficientOfVariation(seg.meteringSamples),
    kind: seg.kind,
    silenceRatio: meteringSilenceRatio(seg.meteringSamples),
  }));
}

async function attachAndroidOpensmileEgmaps(
  snapshots: readonly OpensmileLowLevelFeatureSnapshot[],
  segments: readonly VoiceRecordingObservationSegment[],
): Promise<OpensmileLowLevelFeatureSnapshot[]> {
  const next: OpensmileLowLevelFeatureSnapshot[] = [];
  for (let i = 0; i < snapshots.length; i += 1) {
    const snap = snapshots[i];
    const seg = segments[i];
    if (snap == null || seg?.uri == null || seg.uri.length === 0) {
      if (snap != null) {
        next.push(snap);
      }
      continue;
    }
    let wavPath: string | null = null;
    try {
      wavPath = await transcodeRecordingToWav(seg.uri);
      const gemapsFunctionals = await extractEgmapsFunctional(wavPath);
      next.push({ ...snap, gemapsFunctionals });
    } finally {
      if (wavPath != null) {
        try {
          await FileSystem.deleteAsync(wavPath, { idempotent: true });
        } catch {
          // без логирования путей
        }
      }
    }
  }
  return next;
}

async function deleteArtifacts(segments: readonly VoiceRecordingObservationSegment[]): Promise<void> {
  await Promise.all(
    segments.map(async (s) => {
      if (s.uri == null || s.uri.length === 0) {
        return;
      }
      try {
        await FileSystem.deleteAsync(s.uri, { idempotent: true });
      } catch {
        // без логирования содержимого аудио
      }
    }),
  );
}

export async function runVoiceMeasurementPipeline(input: {
  capturedAtIso: string;
  extractor?: VoiceOpensmileExtractor | undefined;
  sessionId: string;
  segments: readonly VoiceRecordingObservationSegment[];
}): Promise<VoiceMeasurementSession | VoicePipelineFailure> {
  const { capturedAtIso, sessionId, segments } = input;
  const extractor = input.extractor ?? createStubOpensmileExtractor();

  if (segments.length !== 2) {
    return {
      failureReason: 'quality_gate_failed',
      retryHints: ['Ожидались два шага записи (гласная и фраза).'],
    };
  }

  const vowel = segments.find((s) => s.kind === 'sustained_vowel_a');
  const phrase = segments.find((s) => s.kind === 'fixed_phrase');
  if (vowel == null || phrase == null) {
    return {
      failureReason: 'quality_gate_failed',
      retryHints: ['Неполный протокол записи.'],
    };
  }

  const gVowel = mergeSegmentGates(
    gateSegmentDuration(
      'удержание «А»',
      vowel.durationMs,
      VOICE_VOWEL_MIN_DURATION_MS,
      VOICE_VOWEL_MAX_DURATION_MS,
    ),
    gateMetering(vowel),
  );
  const gPhrase = mergeSegmentGates(
    gateSegmentDuration(
      'фиксированная фраза',
      phrase.durationMs,
      VOICE_PHRASE_MIN_DURATION_MS,
      VOICE_PHRASE_MAX_DURATION_MS,
    ),
    gateMetering(phrase),
  );

  const mergedGate = mergeSegmentGates(gVowel, gPhrase);
  const overall = resolveOverallQuality(mergedGate.retryReasons);
  const confidencePercent = computeConfidencePercent(mergedGate.flags);

  const orderedSegments = [vowel, phrase];
  let snapshots = buildSnapshots(orderedSegments);
  let extractorVersion = VOICE_EXTRACTOR_VERSION_STUB;
  let featureSet: typeof VOICE_FEATURE_SET_EGEMAPS | typeof VOICE_FEATURE_SET_STUB =
    VOICE_FEATURE_SET_STUB;

  const useNativeOpensmile =
    Platform.OS === 'android' && isAndroidOpensmileNativeAvailable();

  if (useNativeOpensmile) {
    try {
      snapshots = await attachAndroidOpensmileEgmaps(snapshots, orderedSegments);
      const okEgmaps = snapshots.every(
        (s) =>
          s.gemapsFunctionals != null && Object.keys(s.gemapsFunctionals).length > 0,
      );
      if (!okEgmaps) {
        await deleteArtifacts(segments);
        return {
          failureReason: 'extractor_failed',
          retryHints: ['Не удалось получить eGeMAPS по всем шагам записи.'],
        };
      }
      extractorVersion = VOICE_EXTRACTOR_VERSION_ANDROID;
      featureSet = VOICE_FEATURE_SET_EGEMAPS;
    } catch (err) {
      if (__DEV__) {
        console.warn('[voice/opensmile] extraction failed:', err);
      }
      await deleteArtifacts(segments);
      return {
        failureReason: 'extractor_failed',
        retryHints: ['Не удалось извлечь признаки openSMILE. Повторите запись.'],
      };
    }
  }

  let extracted: OpensmileLowLevelFeatureSnapshot[];
  try {
    extracted = extractor.extract(snapshots);
  } catch {
    await deleteArtifacts(segments);
    return { failureReason: 'extractor_failed', retryHints: ['Не удалось извлечь признаки.'] };
  }

  if (extracted.length === 0) {
    await deleteArtifacts(segments);
    return { failureReason: 'extractor_failed', retryHints: ['Пустой вектор признаков.'] };
  }

  const { acousticSnapshot, coreMetricsBase } = computeVoiceCoreMetrics(extracted);
  const baseline = await loadVoicePersonalBaseline(sessionId);
  const coreMetrics = enrichVoiceCoreWithStress({
    acousticSnapshot,
    coreWithoutStress: coreMetricsBase,
    personalBaseline: baseline,
  });
  const comparison = buildVoiceComparison(coreMetrics, baseline);
  const metrics = deriveLegacyVoiceMetrics(coreMetrics);

  if (__DEV__ && featureSet === VOICE_FEATURE_SET_EGEMAPS) {
    const withMaps = extracted.filter(
      (r) => r.gemapsFunctionals != null && Object.keys(r.gemapsFunctionals).length > 0,
    );
    const keys = new Set<string>();
    for (const r of withMaps) {
      Object.keys(r.gemapsFunctionals ?? {}).forEach((k) => keys.add(k));
    }
    const merged: Record<string, number> = {};
    for (const k of keys) {
      let sum = 0;
      let n = 0;
      for (const r of withMaps) {
        const v = r.gemapsFunctionals?.[k];
        if (v !== undefined && Number.isFinite(v)) {
          sum += v;
          n += 1;
        }
      }
      if (n > 0) {
        merged[k] = sum / n;
      }
    }
    const phraseMap = withMaps.find((r) => r.kind === 'fixed_phrase')?.gemapsFunctionals;
    const signals = extractEgmapsAcousticSignals(merged, phraseMap);
    console.warn('[voice/egemaps] scoring inputs', {
      columnCount: keys.size,
      sampleColumns: [...keys].slice(0, 6),
      signals,
      usable: hasUsableEgmapsSignals(signals, keys.size),
      metrics,
    });
  }

  const durationMs = vowel.durationMs + phrase.durationMs;

  const quality: VoiceQualityResult = {
    confidencePercent,
    flags: mergedGate.flags.length > 0 ? [...mergedGate.flags] : undefined,
    overall,
    retryReasons:
      mergedGate.retryReasons.length > 0 ? [...mergedGate.retryReasons] : undefined,
  };

  await deleteArtifacts(segments);

  const interpretation = buildVoiceInterpretation(
    coreMetrics,
    comparison,
    overall,
    featureSet === VOICE_FEATURE_SET_EGEMAPS,
  );

  const session: VoiceMeasurementSession = {
    acousticSnapshot,
    capturedAt: capturedAtIso,
    comparison,
    coreMetrics,
    durationMs,
    extractorId: VOICE_EXTRACTOR_ID,
    extractorVersion,
    featureSet,
    id: sessionId,
    interpretation,
    metrics,
    protocolVersion: VOICE_PROTOCOL_VERSION,
    quality,
    scoringVersion: VOICE_SCORING_VERSION,
  };
  return session;
}

export function mapVoiceRecordingError(errorMessage: string): VoicePipelineFailure {
  if (errorMessage === 'microphone_denied') {
    return {
      failureReason: 'microphone_denied',
      retryHints: ['Разрешите доступ к микрофону в настройках устройства.'],
    };
  }
  return {
    failureReason: 'recording_failed',
    retryHints: ['Повторите запись ещё раз.'],
  };
}
