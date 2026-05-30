import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import {
  VOICE_FIXED_PHRASE_TEXT,
  VOICE_PHRASE_MIN_DURATION_MS,
  VOICE_VOWEL_MAX_DURATION_MS,
  VOICE_VOWEL_MIN_DURATION_MS,
} from '@/lib/biometrics/constants/voice-capture.constants';
import type {
  VoiceMeasurementSession,
  VoiceRecordingObservationSegment,
} from '@/lib/biometrics/types/voice-measurement.types';
import {
  createExpoVoiceRecorderAdapter,
  type VoiceRecorderAdapter,
} from '@/lib/biometrics/voice/audio-capture.adapter';
import { isAndroidOpensmileNativeAvailable } from '@/lib/biometrics/voice/android-opensmile.bridge';
import {
  mapVoiceRecordingError,
  runVoiceMeasurementPipeline,
} from '@/lib/biometrics/voice/run-voice-pipeline';
import { VoiceCoreMetricsSummary } from '@/features/biometrics/VoiceCoreMetricsSummary';
import { saveVoiceSessionRecord } from '@/lib/biometrics/voice/voice-session-history.store';
import { createVoiceSessionId } from '@/lib/biometrics/voice/voice-session-id.helper';
import { submitVoiceMeasurement } from '@/lib/api/app-voice-measurement';
import type { SubmitVoiceMeasurementBody } from '@/lib/api/types/voice-measurement.types';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

type FlowPhase =
  | 'vowel_intro'
  | 'vowel_record'
  | 'phrase_intro'
  | 'phrase_record'
  | 'processing'
  | 'summary';

export type VoiceCaptureFlowProps = {
  enableRemoteSync?: boolean | undefined;
  onBack: () => void;
  onComplete: (session: VoiceMeasurementSession) => void;
  screenTitle: string;
};

function voicePayloadFromSession(session: VoiceMeasurementSession): SubmitVoiceMeasurementBody {
  return {
    acousticSnapshot: session.acousticSnapshot,
    capturedAt: session.capturedAt,
    comparison: session.comparison,
    coreMetrics: session.coreMetrics,
    durationMs: session.durationMs,
    extractorId: session.extractorId,
    extractorVersion: session.extractorVersion,
    featureSet: session.featureSet,
    id: session.id,
    interpretation: session.interpretation,
    metrics: session.metrics,
    protocolVersion: session.protocolVersion,
    quality: session.quality,
    scoringVersion: session.scoringVersion,
  };
}

function scheduleRemoteSync(session: VoiceMeasurementSession, enabled: boolean): void {
  if (!enabled) {
    return;
  }
  void submitVoiceMeasurement(voicePayloadFromSession(session)).catch(() => {});
}

export function VoiceCaptureFlow({
  enableRemoteSync = true,
  onBack,
  onComplete,
  screenTitle,
}: VoiceCaptureFlowProps): JSX.Element {
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const [phase, setPhase] = useState<FlowPhase>('vowel_intro');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionResult, setSessionResult] = useState<VoiceMeasurementSession | null>(null);
  const recorderRef = useRef<VoiceRecorderAdapter | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vowelSegRef = useRef<VoiceRecordingObservationSegment | null>(null);

  const stopTicker = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTicker();
      const rec = recorderRef.current;
      recorderRef.current = null;
      if (rec != null) {
        void rec.stop().catch(() => {});
      }
    };
  }, [stopTicker]);

  const startTicker = useCallback(
    (adapter: VoiceRecorderAdapter) => {
      stopTicker();
      timerRef.current = setInterval(() => {
        void adapter.tickDurationMs().then((ms) => {
          setElapsedMs(ms);
        });
      }, 200);
    },
    [stopTicker],
  );

  const beginRecording = useCallback(
    async (nextPhase: FlowPhase): Promise<boolean> => {
      stopTicker();
      setElapsedMs(0);
      const adapter = createExpoVoiceRecorderAdapter();
      recorderRef.current = adapter;
      try {
        await adapter.start();
      } catch (e) {
        recorderRef.current = null;
        const msg = e instanceof Error ? e.message : String(e);
        const failure = mapVoiceRecordingError(msg);
        Alert.alert(
          'Микрофон',
          failure.retryHints?.[0] ?? 'Не удалось начать запись.',
        );
        return false;
      }
      setPhase(nextPhase);
      startTicker(adapter);
      return true;
    },
    [startTicker, stopTicker],
  );

  const stopRecording = useCallback(
    async (
      kind: VoiceRecordingObservationSegment['kind'],
    ): Promise<VoiceRecordingObservationSegment | null> => {
      const adapter = recorderRef.current;
      if (adapter == null) {
        return null;
      }
      stopTicker();
      try {
        const stopped = await adapter.stop();
        recorderRef.current = null;
        return {
          durationMs: stopped.durationMs,
          kind,
          meteringSamples: stopped.meteringSamples,
          uri: stopped.uri,
        };
      } catch (e) {
        recorderRef.current = null;
        const msg = e instanceof Error ? e.message : String(e);
        Alert.alert('Запись', msg.length > 0 ? msg : 'Сбой остановки записи.');
        return null;
      }
    },
    [stopTicker],
  );

  const runPipeline = useCallback(
    async (pair: readonly VoiceRecordingObservationSegment[]): Promise<void> => {
      setPhase('processing');
      const sessionId = createVoiceSessionId();
      const capturedAtIso = new Date().toISOString();
      const outcome = await runVoiceMeasurementPipeline({
        capturedAtIso,
        sessionId,
        segments: pair,
      });
      if ('failureReason' in outcome) {
        vowelSegRef.current = null;
        setPhase('vowel_intro');
        Alert.alert(
          'Не получилось',
          outcome.retryHints?.join('\n') ?? 'Повторите замер.',
        );
        return;
      }
      await saveVoiceSessionRecord(sessionId, outcome);
      scheduleRemoteSync(outcome, enableRemoteSync);
      setSessionResult(outcome);
      setPhase('summary');
    },
    [enableRemoteSync],
  );

  const onStartVowel = useCallback(async () => {
    vowelSegRef.current = null;
    await beginRecording('vowel_record');
  }, [beginRecording]);

  const onStopVowel = useCallback(async () => {
    const seg = await stopRecording('sustained_vowel_a');
    if (seg == null) {
      return;
    }
    if (seg.durationMs < VOICE_VOWEL_MIN_DURATION_MS) {
      Alert.alert(
        'Коротко',
        `Удерживайте звук «А» хотя бы ${String(Math.ceil(VOICE_VOWEL_MIN_DURATION_MS / 1000))} сек.`,
      );
      setPhase('vowel_intro');
      return;
    }
    vowelSegRef.current = seg;
    setPhase('phrase_intro');
  }, [stopRecording]);

  const onStartPhrase = useCallback(async () => {
    await beginRecording('phrase_record');
  }, [beginRecording]);

  const onStopPhrase = useCallback(async () => {
    const phraseSeg = await stopRecording('fixed_phrase');
    if (phraseSeg == null) {
      return;
    }
    if (phraseSeg.durationMs < VOICE_PHRASE_MIN_DURATION_MS) {
      Alert.alert(
        'Коротко',
        `Фраза должна занять минимум ${String(Math.ceil(VOICE_PHRASE_MIN_DURATION_MS / 1000))} сек.`,
      );
      setPhase('phrase_intro');
      return;
    }
    const vowelSeg = vowelSegRef.current;
    if (vowelSeg == null) {
      Alert.alert('Сессия', 'Нет записи гласной — начните сначала.');
      setPhase('vowel_intro');
      return;
    }
    await runPipeline([vowelSeg, phraseSeg]);
  }, [runPipeline, stopRecording]);

  const summaryModel = sessionResult;

  if (phase === 'processing') {
    return (
      <View style={[bf.captureScreen, { justifyContent: 'center', padding: 24 }]}>
        <Text style={bf.captureTitle}>{screenTitle}</Text>
        <ActivityIndicator color={t.tint} size="large" style={{ marginTop: 24 }} />
        <Text style={[bf.captureHint, { marginTop: 16 }]}>
          Считаем признаки на устройстве и проверяем качество записи…
        </Text>
      </View>
    );
  }

  if (phase === 'summary' && summaryModel != null) {
    return (
      <ScrollView
        contentContainerStyle={[bf.scroll, { paddingBottom: 48 }]}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Pressable hitSlop={8} style={bf.ghostTop} onPress={onBack}>
          <Text style={bf.ghostTopText}>← Закрыть</Text>
        </Pressable>
        <Text style={bf.blockTitle}>{screenTitle}</Text>
        {summaryModel.interpretation ? (
          <View style={bf.interpretationPanel}>
            <Text style={bf.interpretationHeadline}>
              {summaryModel.interpretation.headline}
            </Text>
            {summaryModel.interpretation.bullets.map((line) => (
              <Text key={line} style={bf.interpretationBullet}>
                • {line}
              </Text>
            ))}
            <Text style={bf.interpretationDisclaimer}>
              {summaryModel.interpretation.disclaimerLine}
            </Text>
          </View>
        ) : null}
        <VoiceCoreMetricsSummary session={summaryModel} />
        <Pressable style={bf.primary} onPress={() => onComplete(summaryModel)}>
          <Text style={bf.primaryText}>Готово</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const recordingHint =
    phase === 'vowel_record'
      ? `Идёт запись… ${String(Math.round(elapsedMs / 100) / 10)} с · цель ${String(
          Math.ceil(VOICE_VOWEL_MIN_DURATION_MS / 1000),
        )}–${String(Math.ceil(VOICE_VOWEL_MAX_DURATION_MS / 1000))} с`
      : phase === 'phrase_record'
        ? `Идёт запись… ${String(Math.round(elapsedMs / 100) / 10)} с · минимум ${String(
            Math.ceil(VOICE_PHRASE_MIN_DURATION_MS / 1000),
          )} с`
        : '';

  return (
    <ScrollView
      contentContainerStyle={[bf.scroll, { paddingBottom: 48 }]}
      style={{ backgroundColor: t.background, flex: 1 }}
    >
      <Pressable hitSlop={8} style={bf.ghostTop} onPress={onBack}>
        <Text style={bf.ghostTopText}>← Закрыть</Text>
      </Pressable>
      <Text style={bf.blockTitle}>{screenTitle}</Text>

      {phase === 'vowel_intro' ? (
        <>
          <Text style={bf.lead}>
            Шаг 1 из 2: спокойно удерживайте гласную «А» на одном выдохе. Запись только на устройстве;
            файл удаляется после расчёта.
          </Text>
          <Pressable style={bf.primary} onPress={() => void onStartVowel()}>
            <Text style={bf.primaryText}>Начать запись «А»</Text>
          </Pressable>
        </>
      ) : null}

      {phase === 'vowel_record' ? (
        <>
          <Text style={bf.instructionBox}>
            Держите ровный звук «А». Нажмите «Стоп», когда закончите выдох (обычно 3–5 секунд).
          </Text>
          <Text style={[bf.captureHint, { marginVertical: 12 }]}>{recordingHint}</Text>
          <Pressable style={bf.primary} onPress={() => void onStopVowel()}>
            <Text style={bf.primaryText}>Стоп</Text>
          </Pressable>
        </>
      ) : null}

      {phase === 'phrase_intro' ? (
        <>
          <Text style={bf.lead}>Шаг 2 из 2: произнесите фразу спокойным темпом:</Text>
          <Text style={bf.instructionBox}>{VOICE_FIXED_PHRASE_TEXT}</Text>
          <Pressable style={bf.primary} onPress={() => void onStartPhrase()}>
            <Text style={bf.primaryText}>Начать запись фразы</Text>
          </Pressable>
          <Pressable style={bf.secondary} onPress={() => setPhase('vowel_intro')}>
            <Text style={bf.secondaryText}>← Перезаписать «А»</Text>
          </Pressable>
        </>
      ) : null}

      {phase === 'phrase_record' ? (
        <>
          <Text style={bf.instructionBox}>{VOICE_FIXED_PHRASE_TEXT}</Text>
          <Text style={[bf.captureHint, { marginVertical: 12 }]}>{recordingHint}</Text>
          <Pressable style={bf.primary} onPress={() => void onStopPhrase()}>
            <Text style={bf.primaryText}>Стоп</Text>
          </Pressable>
        </>
      ) : null}

      <Text style={bf.privacyBox}>
        Это не медицинская оценка: приложение подсказывает по акустическим маркерам.
        {Platform.OS === 'android' && isAndroidOpensmileNativeAvailable()
          ? ' На этом устройстве признаки извлекаются через openSMILE (eGeMAPS).'
          : ' На этой платформе пока используются упрощённые прокси по записи.'}
      </Text>
    </ScrollView>
  );
}
