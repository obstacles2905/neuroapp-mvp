import { FaceCoreMetricsSummary } from '@/features/biometrics/FaceCoreMetricsSummary';
import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import {
  FACE_PHASE_INSTRUCTIONS,
  FACE_PROTOCOL_PHASE_ORDER,
  FACE_PREFLIGHT_COUNTDOWN_SEC,
} from '@/lib/biometrics/constants/face-capture.constants';
import {
  buildFacePhaseObservation,
  captureFaceBurstFromCamera,
  mapFaceCaptureError,
  pickGalleryImageUri,
} from '@/lib/biometrics/face/face-capture.adapter';
import {
  hasFaceBiometryConsent,
  setFaceBiometryConsent,
} from '@/lib/biometrics/face/face-consent.store';
import {
  isFaceMeasurementPipelineAvailable,
  mapFacePipelineError,
  runFaceMeasurementPipeline,
} from '@/lib/biometrics/face/run-face-pipeline';
import {
  recomputePersistedFaceSession,
  saveFaceSessionRecord,
} from '@/lib/biometrics/face/face-session-history.store';
import { createFaceSessionId } from '@/lib/biometrics/face/face-session-id.helper';
import type {
  FaceExpressionMeasurementSession,
  FaceFrameSource,
  FacePhaseObservation,
  FaceProtocolPhase,
} from '@/lib/biometrics/types/face-measurement.types';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

type FlowPhase =
  | 'consent'
  | 'intro'
  | 'phase_pick'
  | 'camera_capture'
  | 'processing'
  | 'summary';

export type FaceExpressionCaptureFlowProps = Readonly<{
  onBack: () => void;
  onComplete: (session: FaceExpressionMeasurementSession) => void;
  onSkip?: (() => void) | undefined;
  screenTitle: string;
}>;

function phaseLabel(phase: FaceProtocolPhase): string {
  if (phase === 'baseline') {
    return 'Шаг 1: нейтральное лицо';
  }
  if (phase === 'guided_smile') {
    return 'Шаг 2: улыбка';
  }
  if (phase === 'guided_frown') {
    return 'Шаг 3: нахмуренные брови';
  }
  return 'Шаг 4: удивление';
}

export function FaceExpressionCaptureFlow({
  onBack,
  onComplete,
  onSkip,
  screenTitle,
}: FaceExpressionCaptureFlowProps): JSX.Element {
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('consent');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [observations, setObservations] = useState<FacePhaseObservation[]>([]);
  const [sessionResult, setSessionResult] = useState<FaceExpressionMeasurementSession | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const sessionIdRef = useRef(createFaceSessionId());

  const currentPhase = FACE_PROTOCOL_PHASE_ORDER[phaseIndex] ?? 'baseline';
  const nativeAvailable = isFaceMeasurementPipelineAvailable();

  useEffect(() => {
    void hasFaceBiometryConsent().then((ok) => {
      setFlowPhase(ok ? 'intro' : 'consent');
    });
  }, []);

  const runPipeline = useCallback(async (obs: readonly FacePhaseObservation[]) => {
    setFlowPhase('processing');
    setBusy(true);
    setError(null);
    try {
      const session = await runFaceMeasurementPipeline({
        capturedAt: new Date().toISOString(),
        observations: obs,
        sessionId: sessionIdRef.current,
      });
      await saveFaceSessionRecord(session);
      setSessionResult(session);
      setFlowPhase('summary');
    } catch (e) {
      const code = e instanceof Error ? e.message : String(e);
      setError(mapFacePipelineError(code));
      setFlowPhase('phase_pick');
    } finally {
      setBusy(false);
    }
  }, []);

  const advanceAfterObservation = useCallback(
    (observation: FacePhaseObservation) => {
      const next = [...observations, observation];
      setObservations(next);
      if (next.length >= FACE_PROTOCOL_PHASE_ORDER.length) {
        void runPipeline(next);
        return;
      }
      setPhaseIndex((i) => i + 1);
      setFlowPhase('phase_pick');
    },
    [observations, runPipeline],
  );

  const runGalleryPick = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const uri = await pickGalleryImageUri();
      if (uri == null) {
        return;
      }
      const observation = await buildFacePhaseObservation(currentPhase, 'gallery', [uri]);
      advanceAfterObservation(observation);
    } catch (e) {
      const code = e instanceof Error ? e.message : String(e);
      setError(mapFaceCaptureError(code));
    } finally {
      setBusy(false);
    }
  }, [advanceAfterObservation, currentPhase]);

  const runCameraBurst = useCallback(async () => {
    const cam = cameraRef.current;
    if (cam == null) {
      setError('Камера ещё не готова.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const uris = await captureFaceBurstFromCamera(cam);
      const observation = await buildFacePhaseObservation(currentPhase, 'camera', uris);
      advanceAfterObservation(observation);
    } catch (e) {
      const code = e instanceof Error ? e.message : String(e);
      setError(mapFaceCaptureError(code));
      setFlowPhase('phase_pick');
    } finally {
      setBusy(false);
      setCountdownSec(null);
    }
  }, [advanceAfterObservation, currentPhase]);

  useEffect(() => {
    if (flowPhase !== 'camera_capture' || countdownSec == null) {
      return;
    }
    if (countdownSec <= 0) {
      void runCameraBurst();
      return;
    }
    const id = setTimeout(() => {
      setCountdownSec((s) => (s == null ? null : s - 1));
    }, 1000);
    return () => clearTimeout(id);
  }, [countdownSec, flowPhase, runCameraBurst]);

  const beginCameraCapture = useCallback(async () => {
    if (cameraPermission?.granted !== true) {
      const perm = await requestCameraPermission();
      if (!perm.granted) {
        setError('Нужен доступ к камере для замера мимики.');
        return;
      }
    }
    setFlowPhase('camera_capture');
    setCountdownSec(FACE_PREFLIGHT_COUNTDOWN_SEC);
  }, [cameraPermission?.granted, requestCameraPermission]);

  const handleRecompute = useCallback(async () => {
    if (sessionResult == null) {
      return;
    }
    setBusy(true);
    try {
      const updated = await recomputePersistedFaceSession(
        sessionResult.id,
        FACE_PROTOCOL_PHASE_ORDER.length,
      );
      if (updated != null) {
        setSessionResult(updated);
      }
    } finally {
      setBusy(false);
    }
  }, [sessionResult]);

  if (flowPhase === 'consent') {
    return (
      <ScrollView
        contentContainerStyle={bf.scroll}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.blockTitle}>{screenTitle}</Text>
        <Text style={bf.lead}>
          Перед замером мимики: анализ выполняется на устройстве, сырые фото на сервер не
          отправляются. После обработки кадры не сохраняются — остаются только числовые
          показатели и технические снимки blendshapes для пересчёта формул.
        </Text>
        <Text style={bf.privacyBox}>
          Это мягкая подсказка по методике, не медицинский диагноз. Продолжая, вы соглашаетесь на
          анализ изображения лица на этом устройстве.
        </Text>
        <Pressable
          style={bf.primary}
          onPress={() => {
            void setFaceBiometryConsent().then(() => setFlowPhase('intro'));
          }}
        >
          <Text style={bf.primaryText}>Согласен — продолжить</Text>
        </Pressable>
        <Pressable style={bf.secondary} onPress={onBack}>
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
        {onSkip != null ? (
          <Pressable style={bf.ghost} onPress={onSkip}>
            <Text style={bf.ghostText}>Пропустить замер мимики</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    );
  }

  if (flowPhase === 'intro') {
    return (
      <ScrollView
        contentContainerStyle={bf.scroll}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.blockTitle}>{screenTitle}</Text>
        <Text style={bf.lead}>
          Четыре шага: нейтральное лицо, улыбка, нахмуренные брови, удивление. На каждом шаге
          можно снять с камеры или выбрать готовое фото из галереи — удобно для отладки и
          сравнения результатов.
        </Text>
        {!nativeAvailable ? (
          <Text style={[bf.instructionBox, { color: t.warningText }]}>
            Нативный Face Landmarker пока недоступен в этой сборке. Для реальных метрик нужен
            development build с модулем NeuroFaceLandmarker.
          </Text>
        ) : null}
        <Pressable style={bf.primary} onPress={() => setFlowPhase('phase_pick')}>
          <Text style={bf.primaryText}>Начать замер</Text>
        </Pressable>
        <Pressable style={bf.secondary} onPress={onBack}>
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
        {onSkip != null ? (
          <Pressable style={bf.ghost} onPress={onSkip}>
            <Text style={bf.ghostText}>Пропустить замер мимики</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    );
  }

  if (flowPhase === 'camera_capture') {
    return (
      <View style={{ backgroundColor: t.background, flex: 1 }}>
        <CameraView ref={cameraRef} facing="front" style={{ flex: 1 }} />
        <View style={{ padding: 16 }}>
          <Text style={bf.blockTitle}>{phaseLabel(currentPhase)}</Text>
          <Text style={bf.instructionBox}>{FACE_PHASE_INSTRUCTIONS[currentPhase]}</Text>
          {countdownSec != null && countdownSec > 0 ? (
            <Text style={[bf.summaryValue, { marginVertical: 8 }]}>{countdownSec}</Text>
          ) : null}
          {busy ? <ActivityIndicator color={t.tint} /> : null}
          {error != null ? <Text style={{ color: t.warningText, marginBottom: 8 }}>{error}</Text> : null}
          <Pressable
            style={bf.secondary}
            onPress={() => {
              setCountdownSec(null);
              setFlowPhase('phase_pick');
            }}
          >
            <Text style={bf.secondaryText}>← Отмена</Text>
          </Pressable>
          {onSkip != null ? (
            <Pressable style={bf.ghost} onPress={onSkip}>
              <Text style={bf.ghostText}>Пропустить замер мимики</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  if (flowPhase === 'processing') {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: t.background,
          flex: 1,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={[bf.blockTitle, { textAlign: 'center' }]}>Фото получены</Text>
        <ActivityIndicator color={t.tint} size="large" style={{ marginTop: 24 }} />
        <Text style={[bf.lead, { marginTop: 16, textAlign: 'center' }]}>
          Все четыре выражения сняты. Считаем мимику на устройстве — это может занять до минуты.
        </Text>
      </View>
    );
  }

  if (flowPhase === 'summary' && sessionResult != null) {
    const interpretation = sessionResult.interpretation;

    return (
      <ScrollView
        contentContainerStyle={bf.scroll}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.blockTitle}>
          {interpretation?.headline ?? 'Результат замера мимики'}
        </Text>
        {interpretation != null ? (
          <View style={bf.interpretationPanel}>
            {interpretation.bullets.map((line) => (
              <Text key={line} style={bf.interpretationBullet}>
                {line}
              </Text>
            ))}
            <Text style={[bf.instructionBox, { marginTop: 12 }]}>
              Дальше: {interpretation.nextStep}
            </Text>
            <Text style={bf.interpretationDisclaimer}>
              {interpretation.disclaimerLine}
            </Text>
          </View>
        ) : null}
        {sessionResult.quality.retryHints.length > 0 && interpretation == null ? (
          <Text style={bf.instructionBox}>{sessionResult.quality.retryHints.join(' ')}</Text>
        ) : null}
        <Pressable
          style={bf.secondary}
          onPress={() => setShowDetails((prev) => !prev)}
        >
          <Text style={bf.secondaryText}>
            {showDetails ? 'Скрыть подробности' : 'Подробнее о показателях'}
          </Text>
        </Pressable>
        {showDetails ? (
          <>
            <FaceCoreMetricsSummary
              interpretation={interpretation}
              metrics={sessionResult.metrics}
            />
            <Pressable
              style={bf.secondary}
              disabled={busy}
              onPress={() => void handleRecompute()}
            >
              <Text style={bf.secondaryText}>
                Пересчитать метрики (те же blendshapes, новая формула)
              </Text>
            </Pressable>
          </>
        ) : null}
        <Pressable
          style={bf.primary}
          onPress={() => onComplete(sessionResult)}
        >
          <Text style={bf.primaryText}>Готово</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const beginSource = (source: FaceFrameSource) => {
    if (source === 'gallery') {
      void runGalleryPick();
      return;
    }
    void beginCameraCapture();
  };

  return (
    <ScrollView
      contentContainerStyle={bf.scroll}
      style={{ backgroundColor: t.background, flex: 1 }}
    >
      <Text style={bf.blockTitle}>{phaseLabel(currentPhase)}</Text>
      <Text style={bf.instructionBox}>{FACE_PHASE_INSTRUCTIONS[currentPhase]}</Text>
      <Text style={bf.lead}>
        Шаг {phaseIndex + 1} из {FACE_PROTOCOL_PHASE_ORDER.length}. Выбери источник кадра.
      </Text>
      {error != null ? <Text style={{ color: t.warningText, marginBottom: 8 }}>{error}</Text> : null}
      {busy ? <ActivityIndicator color={t.tint} style={{ marginBottom: 12 }} /> : null}
      <Pressable
        style={bf.primary}
        disabled={busy}
        onPress={() => beginSource('camera')}
      >
        <Text style={bf.primaryText}>Снять с камеры</Text>
      </Pressable>
      <Pressable
        style={bf.secondary}
        disabled={busy}
        onPress={() => beginSource('gallery')}
      >
        <Text style={bf.secondaryText}>Выбрать из галереи</Text>
      </Pressable>
      <Pressable style={bf.secondary} onPress={onBack}>
        <Text style={bf.secondaryText}>← Выйти</Text>
      </Pressable>
      {onSkip != null ? (
        <Pressable style={bf.ghost} onPress={onSkip}>
          <Text style={bf.ghostText}>Пропустить замер мимики</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
