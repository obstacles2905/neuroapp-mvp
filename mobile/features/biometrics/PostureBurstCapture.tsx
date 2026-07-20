import { PoseSessionSummaryContent } from '@/features/biometrics/PoseSessionSummaryContent';
import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import {
  POSE_BURST_FRAME_COUNT,
  POSE_BURST_FRAME_DELAY_MS,
  POSE_PIPELINE_MODEL_ID,
  POSE_PIPELINE_MODEL_VERSION,
  POSE_PREFLIGHT_COUNTDOWN_SEC,
} from '@/lib/biometrics/constants/pose-capture.constants';
import { persistPoseBurstFrames } from '@/lib/biometrics/persist-pose-burst';
import { savePoseSessionRecord } from '@/lib/biometrics/pose-session-history.store';
import { runPosePipelineFromBurst } from '@/lib/biometrics/run-pose-pipeline';
import type {
  PoseBurstObservation,
  PoseCaptureViewKind,
  PoseDualViewSessionResult,
  PoseSingleViewPipelineResult,
} from '@/lib/biometrics/types/pose-measurement.types';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from 'expo-router';
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
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FlowStep =
  | 'camera_frontal'
  | 'camera_profile'
  | 'processing_merge'
  | 'summary';

const CAPTURE_HINT_FRONTAL =
  `Анфас: фронталкой на себя. Полный рост и 2–3 м не обязательны: можно ближе и «по грудь», если в кадре видны оба плеча (перекос и линия плеч). Надёжнее для метрик — ещё и линия бёдер в кадре; можно держать телефон в руке. Таймер — встать перед серией из ${String(POSE_BURST_FRAME_COUNT)} снимков.`;

const CAPTURE_HINT_PROFILE =
  `Профиль: развернись боком к камере. Для углов сутулости/«холки» нужны плечи и опора по тазу — кадр «только лицо» хуже; лучше торс до таза в кадре. Те же ${String(POSE_BURST_FRAME_COUNT)} кадра.`;

export type PostureBurstCaptureProps = {
  onBack: () => void;
  onComplete: (result: PoseDualViewSessionResult) => void;
  onSkip?: (() => void) | undefined;
  screenTitle: string;
  hideParentTabBar?: boolean;
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
  // Намеренно НЕ ставим skipProcessing: true — пусть expo-camera применяет EXIF Orientation;
  // дальше persist-pose-burst ещё раз пропустит JPEG через expo-image-manipulator
  // и окончательно «выровняет» пиксели + сбросит тег ориентации.
  const photoOpts = { quality: Platform.OS === 'android' ? 0.72 : 0.75 } as const;
  for (let i = 0; i < frameCount; i += 1) {
    const photo = await camera.takePictureAsync(photoOpts);
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
  onSkip,
  screenTitle,
  hideParentTabBar = true,
}: PostureBurstCaptureProps): JSX.Element {
  const navigation = useNavigation();
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const cameraRef = useRef<CameraRef>(null);
  const sessionPackIdRef = useRef<string | null>(null);
  const frontalPipelinePromiseRef = useRef<Promise<PoseSingleViewPipelineResult> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [step, setStep] = useState<FlowStep>('camera_frontal');
  const [error, setError] = useState<string | null>(null);
  const [sessionDual, setSessionDual] = useState<PoseDualViewSessionResult | null>(null);
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

  useEffect(() => {
    if (Platform.OS === 'web' || !hideParentTabBar) {
      return undefined;
    }
    const parent = navigation.getParent();
    if (parent?.setOptions == null) {
      return undefined;
    }
    const onCameraSteps =
      step === 'camera_frontal' ||
      step === 'camera_profile' ||
      step === 'processing_merge';
    if (onCameraSteps) {
      parent.setOptions({
        tabBarStyle: { display: 'none', height: 0, overflow: 'hidden' },
      });
    } else {
      parent.setOptions({ tabBarStyle: undefined });
    }
    return () => {
      parent.setOptions({ tabBarStyle: undefined });
    };
  }, [hideParentTabBar, navigation, step]);

  const finalizeBurstFromCacheUris = useCallback(
    async (cacheUris: readonly string[], viewKind: PoseCaptureViewKind) => {
      const persistOutcome =
        viewKind === 'frontal'
          ? await persistPoseBurstFrames(cacheUris)
          : await persistPoseBurstFrames(cacheUris, {
              sessionId: sessionPackIdRef.current!,
              slot: 'profile',
            });

      const { frameUris, sessionId } = persistOutcome;

      if (viewKind === 'frontal') {
        sessionPackIdRef.current = sessionId;
        const capturedAt = new Date().toISOString();
        const observation: PoseBurstObservation = {
          capturedAt,
          frameUris,
          viewKind,
        };
        frontalPipelinePromiseRef.current = runPosePipelineFromBurst(observation);
        setStep('camera_profile');
        return;
      }

      const capturedAt = new Date().toISOString();
      const profileObservation: PoseBurstObservation = {
        capturedAt,
        frameUris,
        viewKind: 'profile',
      };

      const frontalPromise = frontalPipelinePromiseRef.current;
      if (frontalPromise == null) {
        throw new Error('Потерян результат анфаса — начни замер сначала.');
      }

      setStep('processing_merge');

      const [frontalRes, profileRes] = await Promise.all([
        frontalPromise,
        runPosePipelineFromBurst(profileObservation),
      ]);

      const dual: PoseDualViewSessionResult = {
        frontal: frontalRes,
        modelId: POSE_PIPELINE_MODEL_ID,
        modelVersion: POSE_PIPELINE_MODEL_VERSION,
        profile: profileRes,
      };

      try {
        await savePoseSessionRecord(sessionId, dual);
      } catch {
        // не блокируем UX
      }

      setSessionDual(dual);
      setStep('summary');
    },
    [],
  );

  const runBurst = useCallback(
    async (viewKind: PoseCaptureViewKind) => {
      setError(null);
      setBusy(true);
      const cam = cameraRef.current;
      if (cam == null) {
        setBusy(false);
        setError('Камера ещё не готова.');
        return;
      }

      const cameraStepAfterFail: FlowStep =
        viewKind === 'frontal' ? 'camera_frontal' : 'camera_profile';

      try {
        if (viewKind === 'profile' && sessionPackIdRef.current == null) {
          throw new Error('Сначала снимите анфас, затем профиль.');
        }
        const cacheUris = await captureBurstToCache(
          cam,
          POSE_BURST_FRAME_COUNT,
          POSE_BURST_FRAME_DELAY_MS,
        );

        await finalizeBurstFromCacheUris(cacheUris, viewKind);
      } catch (e) {
        setStep(cameraStepAfterFail);
        const message = e instanceof Error ? e.message : 'Съёмка не удалась.';
        setError(message);
      } finally {
        setBusy(false);
      }
    },
    [finalizeBurstFromCacheUris],
  );

  const pickDebugBurstFromGallery = useCallback(async () => {
    const viewKind: PoseCaptureViewKind =
      step === 'camera_profile' ? 'profile' : 'frontal';

    if (busy || countdownSec != null) {
      return;
    }
    if (viewKind === 'profile' && sessionPackIdRef.current == null) {
      setError('Сначала передай анфас (камера или галерея).');
      return;
    }

    setError(null);

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('Нужен доступ к фото для загрузки из галереи.');
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (picked.canceled || picked.assets[0]?.uri == null) {
        return;
      }

      const pickedUri = picked.assets[0].uri;
      const cacheUris = Array.from({ length: POSE_BURST_FRAME_COUNT }, () => pickedUri);

      setBusy(true);

      await finalizeBurstFromCacheUris(cacheUris, viewKind);
    } catch (e) {
      const cameraStepAfterFail: FlowStep =
        viewKind === 'frontal' ? 'camera_frontal' : 'camera_profile';
      setStep(cameraStepAfterFail);
      const message = e instanceof Error ? e.message : 'Галерея не удалась.';
      setError(message);
    } finally {
      setBusy(false);
    }
  }, [busy, countdownSec, finalizeBurstFromCacheUris, step]);

  const cancelCountdown = useCallback(() => {
    countdownAbortRef.current = true;
    setCountdownSec(null);
  }, []);

  const activeViewForCamera: PoseCaptureViewKind =
    step === 'camera_profile' ? 'profile' : 'frontal';

  const runPreflightCountdown = useCallback(async () => {
    if (!cameraReady || busy) {
      return;
    }
    setError(null);
    countdownAbortRef.current = false;
    const viewKind =
      step === 'camera_profile' ? 'profile' : 'frontal';
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
    await runBurst(viewKind);
  }, [busy, cameraReady, runBurst, step]);

  const retake = useCallback(() => {
    sessionPackIdRef.current = null;
    frontalPipelinePromiseRef.current = null;
    setSessionDual(null);
    setError(null);
    setStep('camera_frontal');
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
        {onSkip != null ? (
          <Pressable style={bf.ghost} onPress={onSkip}>
            <Text style={bf.ghostText}>Пропустить замер осанки</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    );
  }

  if (step === 'processing_merge') {
    return (
      <SafeAreaView style={[bf.captureScreen, styles.centered, { paddingHorizontal: 24 }]}>
        <ActivityIndicator color={t.tint} size="large" />
        <Text style={[bf.blockTitle, { marginTop: 20, textAlign: 'center' }]}>Собираем отчёт</Text>
        <Text style={[bf.lead, { textAlign: 'center' }]}>
          Анфас уже считается в фоне; сейчас параллельно добиваем профиль и склеиваем результат — один раз
          ожидания вместо двух пауз по минуте.
        </Text>
      </SafeAreaView>
    );
  }

  if (step === 'summary' && sessionDual != null) {
    const dual = sessionDual;
    return (
      <SafeAreaView style={bf.captureScreen}>
        <ScrollView
          contentContainerStyle={[bf.scroll, { flexGrow: 1 }]}
          style={{ flex: 1 }}
        >
          <PoseSessionSummaryContent
            dual={dual}
            footer={
              <>
                <Pressable style={bf.primary} onPress={() => onComplete(dual)}>
                  <Text style={bf.primaryText}>Продолжить</Text>
                </Pressable>
                <Pressable style={bf.secondary} onPress={retake}>
                  <Text style={bf.secondaryText}>Переснять оба ракурса</Text>
                </Pressable>
              </>
            }
            lead="Двухракурсный замер (анфас + профиль): ниже — числа по точкам и производным MediaPipe, эталон и отклонение. Запись сохранена в истории на устройстве."
            title="Результат замера"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const cameraStepLabel = activeViewForCamera === 'frontal' ? 'Шаг 1 · анфас' : 'Шаг 2 · профиль';
  const bottomHint =
    activeViewForCamera === 'frontal'
      ? 'Оба плеча в кадре (лучше ещё бёдра). Затем — профиль.'
      : 'Профиль: плечи и нижний торс/таз в кадре. Анфас считается в фоне — можно сразу снимать.';
  const hintText = activeViewForCamera === 'frontal' ? CAPTURE_HINT_FRONTAL : CAPTURE_HINT_PROFILE;

  return (
    <View style={styles.cameraFullscreenRoot}>
      <CameraView
        ref={cameraRef}
        facing="front"
        style={StyleSheet.absoluteFillObject}
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
      <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.topChrome}>
        <View style={styles.topChromeInner}>
          <Pressable
            hitSlop={12}
            style={styles.topBack}
            onPress={() => {
              if (countdownSec != null) {
                cancelCountdown();
                return;
              }
              if (step === 'camera_profile') {
                frontalPipelinePromiseRef.current = null;
                sessionPackIdRef.current = null;
                setStep('camera_frontal');
                setError(null);
                return;
              }
              if (step === 'camera_frontal') {
                onBack();
              }
            }}
          >
            <Text style={styles.topBackLabel}>← Назад</Text>
          </Pressable>
          <Text numberOfLines={1} style={styles.topTitle}>
            {`${screenTitle} · ${cameraStepLabel}`}
          </Text>
          <View style={styles.topActions}>
            {onSkip != null ? (
              <Pressable hitSlop={8} style={styles.topSkipBtn} onPress={onSkip}>
                <Text style={styles.topSkipLabel}>Пропустить</Text>
              </Pressable>
            ) : null}
            <Pressable
              hitSlop={8}
              style={styles.topHelpBtn}
              onPress={() => Alert.alert('Как снять', hintText)}
            >
              <Text style={styles.topHelpLabel}>Подсказка</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.bottomChrome}>
        <Text numberOfLines={3} style={styles.bottomHintShort}>
          {bottomHint}
        </Text>
        {error != null ? <Text style={styles.bottomError}>{error}</Text> : null}
        <Pressable
          disabled={
            !cameraReady ||
            busy ||
            countdownSec != null
          }
          style={[
            bf.primary,
            (!cameraReady ||
              busy ||
              countdownSec != null) &&
              styles.disabledBtn,
          ]}
          onPress={() => void runPreflightCountdown()}
        >
          <Text style={bf.primaryText}>
            Таймер {String(POSE_PREFLIGHT_COUNTDOWN_SEC)} с — снять серию
          </Text>
        </Pressable>
        <Pressable
          disabled={
            !cameraReady ||
            busy ||
            countdownSec != null
          }
          style={[bf.secondary, styles.bottomSecondaryOnDark]}
          onPress={() => void runBurst(activeViewForCamera)}
        >
          <Text style={styles.bottomSecondaryText}>
            Снять сразу ({String(POSE_BURST_FRAME_COUNT)} кадра)
          </Text>
        </Pressable>
        {__DEV__ ? (
          <Pressable
            disabled={busy || countdownSec != null}
            style={[bf.secondary, styles.bottomSecondaryOnDark]}
            onPress={() => void pickDebugBurstFromGallery()}
          >
            <Text style={styles.bottomSecondaryText}>
              Дебаг: один снимок из галереи ({String(POSE_BURST_FRAME_COUNT)}×)
            </Text>
          </Pressable>
        ) : null}
        {onSkip != null ? (
          <Pressable
            disabled={busy || countdownSec != null}
            style={styles.bottomSkipOnDark}
            onPress={onSkip}
          >
            <Text style={styles.bottomSkipText}>Пропустить замер осанки</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraFullscreenRoot: {
    backgroundColor: '#000',
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  topChrome: {
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 12,
  },
  topChromeInner: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topBack: { paddingVertical: 4 },
  topBackLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  topActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 8,
  },
  topSkipBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  topSkipLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  topHelpBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  topHelpLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  topTitle: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  bottomChrome: {
    backgroundColor: 'rgba(0,0,0,0.62)',
    bottom: 0,
    gap: 12,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    position: 'absolute',
    right: 0,
    zIndex: 12,
  },
  bottomHintShort: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  bottomError: {
    color: '#FBBF24',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomSecondaryOnDark: {
    alignSelf: 'stretch',
    marginTop: 0,
  },
  bottomSecondaryText: {
    color: '#A5F3FC',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSkipOnDark: {
    alignSelf: 'center',
    marginTop: 4,
    paddingVertical: 8,
  },
  bottomSkipText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textAlign: 'center',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
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
