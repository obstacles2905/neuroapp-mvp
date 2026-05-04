import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import {
  POSE_BURST_FRAME_COUNT,
  POSE_BURST_FRAME_DELAY_MS,
  POSE_PREFLIGHT_COUNTDOWN_SEC,
} from '@/lib/biometrics/constants/pose-capture.constants';
import { persistPoseBurstFrames } from '@/lib/biometrics/persist-pose-burst';
import { runPosePipelineFromBurst } from '@/lib/biometrics/run-pose-pipeline';
import type {
  PoseBurstObservation,
  PoseBurstSessionResult,
} from '@/lib/biometrics/types/pose-measurement.types';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  type ComponentRef,
  type JSX,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type PostureBurstCaptureProps = {
  onBack: () => void;
  onComplete: (result: PoseBurstSessionResult) => void;
  screenTitle: string;
};

type CameraRef = ComponentRef<typeof CameraView>;

async function sleepMs(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function captureBurstToCache(
  camera: CameraRef,
  frameCount: number,
  delayMs: number,
): Promise<string[]> {
  const uris: string[] = [];
  for (let i = 0; i < frameCount; i += 1) {
    const photo = await camera.takePictureAsync({ quality: 0.85 });
    uris.push(photo.uri);
    const hasMore = i + 1 < frameCount;
    if (!hasMore) {
      break;
    }
    await sleepMs(delayMs);
  }
  return uris;
}

export function PostureBurstCapture({
  onBack,
  onComplete,
  screenTitle,
}: PostureBurstCaptureProps): JSX.Element {
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const cameraRef = useRef<CameraRef>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [step, setStep] = useState<'camera' | 'processing' | 'summary'>('camera');
  const [error, setError] = useState<string | null>(null);
  const [sessionResult, setSessionResult] =
    useState<PoseBurstSessionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const countdownAbortRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }
    if (permission == null) {
      return;
    }
    if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const runBurst = useCallback(async () => {
    setError(null);
    setBusy(true);
    const cam = cameraRef.current;
    if (cam == null) {
      setBusy(false);
      setError('Камера ещё не готова.');
      return;
    }

    try {
      setStep('processing');
      const cacheUris = await captureBurstToCache(
        cam,
        POSE_BURST_FRAME_COUNT,
        POSE_BURST_FRAME_DELAY_MS,
      );
      const persisted = await persistPoseBurstFrames(cacheUris);
      const capturedAt = new Date().toISOString();
      const observation: PoseBurstObservation = {
        capturedAt,
        frameUris: persisted,
      };
      const result = await runPosePipelineFromBurst(observation);
      setSessionResult(result);
      setStep('summary');
    } catch (e) {
      setStep('camera');
      const message = e instanceof Error ? e.message : 'Съёмка не удалась.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }, []);

  const cancelCountdown = useCallback(() => {
    countdownAbortRef.current = true;
    setCountdownSec(null);
  }, []);

  const runPreflightCountdown = useCallback(async () => {
    if (!cameraReady || busy) {
      return;
    }
    setError(null);
    countdownAbortRef.current = false;
    for (let s = POSE_PREFLIGHT_COUNTDOWN_SEC; s >= 1; s -= 1) {
      if (countdownAbortRef.current) {
        setCountdownSec(null);
        return;
      }
      setCountdownSec(s);
      await sleepMs(1000);
    }
    setCountdownSec(null);
    if (countdownAbortRef.current) {
      return;
    }
    await runBurst();
  }, [busy, cameraReady, runBurst]);

  const retake = useCallback(() => {
    setSessionResult(null);
    setError(null);
    setStep('camera');
    setCountdownSec(null);
    countdownAbortRef.current = true;
  }, []);

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={[bf.captureScreen, { paddingHorizontal: 20 }]}>
        <Text style={bf.captureTitle}>{screenTitle}</Text>
        <Text style={[bf.captureHint, { marginTop: 12 }]}>
          Камера для этого замера доступна в приложении на iOS и Android, не в веб-сборке.
        </Text>
        <Pressable style={bf.secondary} onPress={onBack}>
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (permission == null) {
    return (
      <SafeAreaView style={[bf.captureScreen, styles.centered]}>
        <ActivityIndicator color={t.tint} size="large" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[bf.captureScreen, { padding: 20 }]}>
        <Text style={bf.captureTitle}>{screenTitle}</Text>
        <Text style={[bf.lead, { marginTop: 12 }]}>
          Нужен доступ к камере — замер выполняется только на устройстве.
        </Text>
        <Pressable style={bf.primary} onPress={() => void requestPermission()}>
          <Text style={bf.primaryText}>Разрешить камеру</Text>
        </Pressable>
        <Pressable style={bf.secondary} onPress={onBack}>
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (step === 'summary' && sessionResult != null) {
    const r = sessionResult;
    return (
      <SafeAreaView style={bf.captureScreen}>
        <ScrollView
          contentContainerStyle={[bf.scroll, { flexGrow: 1 }]}
          style={{ flex: 1 }}
        >
          <Text style={bf.blockTitle}>Результат замера</Text>
          <Text style={bf.lead}>
            Оценка осанки по MediaPipe Pose (lite) на устройстве. Значения ориентировочные и зависят от
            ракурса и одежды.
          </Text>
          <View style={bf.summaryBox}>
            <Text style={bf.summaryLabel}>Модель / версия протокола</Text>
            <Text style={bf.summaryValue}>
              {r.modelId} @ {r.modelVersion}
            </Text>
            <Text style={bf.summaryLabel}>Качество кадра (min visibility)</Text>
            <Text style={bf.summaryValue}>
              {r.metrics.frameQualityScore != null
                ? r.metrics.frameQualityScore.toFixed(2)
                : '—'}
            </Text>
            <Text style={bf.summaryLabel}>Наклон головы (условн.)</Text>
            <Text style={bf.summaryValue}>
              {r.metrics.headTiltDeg != null ? `${r.metrics.headTiltDeg.toFixed(1)}°` : '—'}
            </Text>
            <Text style={bf.summaryLabel}>Плечи к горизонту</Text>
            <Text style={bf.summaryValue}>
              {r.metrics.shoulderLineTiltDeg != null
                ? `${r.metrics.shoulderLineTiltDeg.toFixed(1)}°`
                : '—'}
            </Text>
            <Text style={bf.summaryLabel}>Перекос плеч (proxy)</Text>
            <Text style={bf.summaryValue}>
              {r.metrics.shoulderAsymmetryProxy != null
                ? r.metrics.shoulderAsymmetryProxy.toFixed(1)
                : '—'}
            </Text>
            {r.metrics.avgInferenceMs != null ? (
              <>
                <Text style={bf.summaryLabel}>Ср. время анализа кадра</Text>
                <Text style={bf.summaryValue}>
                  {`${r.metrics.avgInferenceMs.toFixed(0)} мс`}
                </Text>
              </>
            ) : null}
            <Text style={bf.summaryLabel}>Статус</Text>
            <Text style={bf.summaryValue}>{r.quality}</Text>
            {r.qualityNote != null ? (
              <>
                <Text style={bf.summaryLabel}>Комментарий</Text>
                <Text style={bf.summaryValue}>{r.qualityNote}</Text>
              </>
            ) : null}
          </View>
          <Pressable style={bf.primary} onPress={() => onComplete(r)}>
            <Text style={bf.primaryText}>Продолжить</Text>
          </Pressable>
          <Pressable style={bf.secondary} onPress={retake}>
            <Text style={bf.secondaryText}>Переснять серию</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={bf.captureScreen}>
      <View style={styles.header}>
        <Pressable
          style={bf.secondary}
          onPress={() => {
            if (countdownSec != null) {
              cancelCountdown();
              return;
            }
            onBack();
          }}
          hitSlop={12}
        >
          <Text style={bf.secondaryText}>← Назад</Text>
        </Pressable>
        <Text style={bf.captureTitle}>{screenTitle}</Text>
        <Text style={bf.captureHint}>
          Постав фронтальной камерой на себя (штатив / полка). Нажми «Таймер» — успеешь занять позу
          в полный рост; затем автоматически снимем {String(POSE_BURST_FRAME_COUNT)} кадра подряд. Либо
          «Снять сразу», если телефон близко.
        </Text>
      </View>
      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          facing="front"
          style={StyleSheet.absoluteFill}
          onCameraReady={() => setCameraReady(true)}
        />
        {countdownSec != null ? (
          <View style={[styles.countdownOverlay, { backgroundColor: t.scrim }]}>
            <Text style={[styles.countdownDigit, { color: t.tint }]}>{String(countdownSec)}</Text>
            <Text style={[styles.countdownHint, { color: t.textInverse }]}>
              Займи позу и замри
            </Text>
            <Pressable
              style={[styles.countdownCancel, { borderColor: 'rgba(255,255,255,0.35)' }]}
              onPress={cancelCountdown}
            >
              <Text style={[styles.countdownCancelLabel, { color: t.textInverse }]}>
                Отменить отсчёт
              </Text>
            </Pressable>
          </View>
        ) : null}
        {step === 'processing' ? (
          <View style={[styles.processingOverlay, { backgroundColor: t.background + 'E6' }]}>
            <ActivityIndicator color={t.tint} size="large" />
            <Text style={[bf.captureHint, { marginTop: 16 }]}>
              MediaPipe: анализ серии кадров…
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[bf.captureBar, { paddingHorizontal: 20 }]}>
        {error != null ? (
          <Text style={[bf.captureHint, { color: t.warningText }]}>{error}</Text>
        ) : null}
        <Pressable
          disabled={!cameraReady || busy || countdownSec != null}
          style={[
            bf.primary,
            (!cameraReady || busy || countdownSec != null) && styles.disabledBtn,
          ]}
          onPress={() => void runPreflightCountdown()}
        >
          <Text style={bf.primaryText}>
            Таймер {String(POSE_PREFLIGHT_COUNTDOWN_SEC)} с — снять серию
          </Text>
        </Pressable>
        <Pressable
          disabled={!cameraReady || busy || countdownSec != null}
          style={bf.secondary}
          onPress={() => void runBurst()}
        >
          <Text style={bf.secondaryText}>
            Снять сразу ({String(POSE_BURST_FRAME_COUNT)} кадра)
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 20,
    marginTop: 12,
    overflow: 'hidden',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  countdownDigit: {
    fontSize: 96,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  countdownHint: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  countdownCancel: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  countdownCancelLabel: {
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
