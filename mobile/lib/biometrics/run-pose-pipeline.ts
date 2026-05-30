import {
  POSE_PIPELINE_MODEL_ID,
  POSE_PIPELINE_MODEL_VERSION,
} from '@/lib/biometrics/constants/pose-capture.constants';
import {
  buildFrontalNumericRows,
  buildProfileNumericRows,
  computeProfileFrameMetrics,
} from '@/lib/biometrics/compute-pose-numeric-rows';
import { computePoseProductMetrics } from '@/lib/biometrics/compute-pose-metrics';
import {
  detectPoseLandmarksFromFile,
  isMediapipePoseDetectorAvailable,
} from '@/lib/biometrics/mediapipe/detect-pose-on-image';
import type {
  PoseBurstObservation,
  PoseLandmarkPoint,
  PosePipelineVisualizationSnapshot,
  PoseProductMetrics,
  PoseSingleViewPipelineResult,
  PoseNumericMetricRow,
  PoseCaptureViewKind,
} from '@/lib/biometrics/types/pose-measurement.types';

const STUB_MODEL_ID = 'stub-local';
const STUB_MODEL_VERSION = '0.0.0';

const RETRY_QUALITY_THRESHOLD = 0.32;

function emptyMetrics(): PoseProductMetrics {
  return {
    avgInferenceMs: null,
    frameQualityScore: null,
    headTiltDeg: null,
    shoulderAsymmetryProxy: null,
    shoulderLineTiltDeg: null,
  };
}

function metricsForLandmarks(kind: PoseCaptureViewKind, landmarks: PoseLandmarkPoint[]): PoseProductMetrics {
  if (kind === 'profile') {
    return computeProfileFrameMetrics(landmarks);
  }
  return computePoseProductMetrics(landmarks);
}

function numericRowsForLandmarks(kind: PoseCaptureViewKind, landmarks: PoseLandmarkPoint[]): PoseNumericMetricRow[] {
  if (kind === 'profile') {
    return buildProfileNumericRows(landmarks);
  }
  return buildFrontalNumericRows(landmarks);
}

type FrameCandidate = {
  frameHeight: number;
  frameUri: string;
  frameWidth: number;
  inferenceMs: number;
  landmarks: PoseLandmarkPoint[];
  metrics: PoseProductMetrics;
};

function compactLandmarkPoint(p: PoseLandmarkPoint): PoseLandmarkPoint {
  const r4 = (n: number) => Math.round(n * 10000) / 10000;
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  return {
    x: r4(p.x),
    y: r4(p.y),
    z: r4(p.z),
    presence: p.presence != null ? r3(p.presence) : undefined,
    visibility: p.visibility != null ? r3(p.visibility) : undefined,
  };
}

function visualizationFromBest(
  landmarks: PoseLandmarkPoint[],
  chosenFrameUri: string,
  frameWidth: number,
  frameHeight: number,
): PosePipelineVisualizationSnapshot {
  return {
    chosenFrameUri,
    frameHeight,
    frameWidth,
    landmarks: landmarks.map(compactLandmarkPoint),
  };
}

function pickBestFrame(candidates: FrameCandidate[]): FrameCandidate | null {
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((best, cur) => {
    const s = cur.metrics.frameQualityScore ?? 0;
    const bs = best.metrics.frameQualityScore ?? 0;
    return s >= bs ? cur : best;
  });
}

/**
 * Пайплайн позы по серии кадров: MediaPipe, лучший кадр по min visibility; числовые строки по медиаторной выборке.
 */
export async function runPosePipelineFromBurst(
  observation: PoseBurstObservation,
): Promise<PoseSingleViewPipelineResult> {
  const viewKind = observation.viewKind ?? 'frontal';

  if (!isMediapipePoseDetectorAvailable()) {
    return {
      metrics: emptyMetrics(),
      numericRows: [],
      observation,
      quality: 'failed',
      qualityNote:
        'Нативный MediaPipe не найден. Собери приложение через npx expo prebuild или EAS Build (не Expo Go).',
    };
  }

  const candidates: FrameCandidate[] = [];
  const errors: string[] = [];

  for (let i = 0; i < observation.frameUris.length; i += 1) {
    const uri = observation.frameUris[i]!;
    try {
      const { bundle, landmarks } = await detectPoseLandmarksFromFile(uri);
      const bw =
        typeof bundle.inputImageWidth === 'number' && bundle.inputImageWidth > 0
          ? bundle.inputImageWidth
          : 0;
      const bh =
        typeof bundle.inputImageHeight === 'number' && bundle.inputImageHeight > 0
          ? bundle.inputImageHeight
          : 0;
      const metrics = metricsForLandmarks(viewKind, landmarks);
      const inf = typeof bundle.inferenceTime === 'number' ? bundle.inferenceTime : 0;
      candidates.push({
        frameHeight: bh,
        frameUri: uri,
        frameWidth: bw,
        inferenceMs: inf,
        landmarks,
        metrics,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка кадра';
      errors.push(msg);
    }
  }

  const best = pickBestFrame(candidates);

  if (best == null) {
    const hint = errors[0] ?? 'Нет валидных кадров.';
    return {
      metrics: emptyMetrics(),
      numericRows: [],
      observation,
      quality: 'failed',
      qualityNote: hint,
    };
  }

  const avgInferenceMs =
    candidates.length > 0
      ? candidates.reduce((s, c) => s + c.inferenceMs, 0) / candidates.length
      : null;

  const metrics: PoseProductMetrics = {
    ...best.metrics,
    avgInferenceMs,
  };

  const q = metrics.frameQualityScore ?? 0;
  const quality = q < RETRY_QUALITY_THRESHOLD ? 'retry_suggested' : 'ok';

  const qualityNote =
    quality === 'retry_suggested'
      ? viewKind === 'profile'
        ? 'Низкая уверенность по ключевым точкам профиля — при развороте в бок улучши свет и занеси всё тело в кадр.'
        : 'Низкая уверенность по ключевым точкам — по возможности пересними при лучшем освещении и полном росте в кадре.'
      : errors.length > 0
        ? `Готово по лучшему кадру; ${String(errors.length)} снимков из серии не удалось разобрать.`
        : 'Готово по лучшему кадру серии.';

  const numericRows = numericRowsForLandmarks(viewKind, best.landmarks);
  const visualization = visualizationFromBest(
    best.landmarks,
    best.frameUri,
    best.frameWidth,
    best.frameHeight,
  );

  return {
    metrics,
    numericRows,
    observation,
    quality,
    qualityNote,
    visualization,
  };
}
