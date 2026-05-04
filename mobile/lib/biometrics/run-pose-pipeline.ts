import {
  POSE_PIPELINE_MODEL_ID,
  POSE_PIPELINE_MODEL_VERSION,
} from '@/lib/biometrics/constants/pose-capture.constants';
import { computePoseProductMetrics } from '@/lib/biometrics/compute-pose-metrics';
import {
  detectPoseLandmarksFromFile,
  isMediapipePoseDetectorAvailable,
} from '@/lib/biometrics/mediapipe/detect-pose-on-image';
import type {
  PoseBurstObservation,
  PoseBurstSessionResult,
  PoseProductMetrics,
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

type FrameCandidate = {
  inferenceMs: number;
  metrics: PoseProductMetrics;
};

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
 * Пайплайн позы по серии кадров: MediaPipe на устройстве, лучший кадр по quality score.
 */
export async function runPosePipelineFromBurst(
  observation: PoseBurstObservation,
): Promise<PoseBurstSessionResult> {
  if (!isMediapipePoseDetectorAvailable()) {
    return {
      metrics: emptyMetrics(),
      modelId: STUB_MODEL_ID,
      modelVersion: STUB_MODEL_VERSION,
      observation,
      quality: 'failed',
      qualityNote:
        'Нативный MediaPipe не найден. Собери приложение через npx expo prebuild или EAS Build (не Expo Go).',
    };
  }

  const candidates: FrameCandidate[] = [];
  const errors: string[] = [];

  for (const uri of observation.frameUris) {
    try {
      const { bundle, landmarks } = await detectPoseLandmarksFromFile(uri);
      const metrics = computePoseProductMetrics(landmarks);
      const inf = typeof bundle.inferenceTime === 'number' ? bundle.inferenceTime : 0;
      candidates.push({ inferenceMs: inf, metrics });
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
      modelId: POSE_PIPELINE_MODEL_ID,
      modelVersion: POSE_PIPELINE_MODEL_VERSION,
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
      ? 'Низкая уверенность по ключевым точкам — по возможности пересними при лучшем освещении и полном росте в кадре.'
      : errors.length > 0
        ? `Готово по лучшему кадру; ${String(errors.length)} снимков из серии не удалось разобрать.`
        : 'Готово по лучшему кадру серии.';

  return {
    metrics,
    modelId: POSE_PIPELINE_MODEL_ID,
    modelVersion: POSE_PIPELINE_MODEL_VERSION,
    observation,
    quality,
    qualityNote,
  };
}
