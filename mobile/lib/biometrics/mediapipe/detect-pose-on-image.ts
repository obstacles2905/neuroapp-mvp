import { POSE_MODEL_FILENAME } from '@/lib/biometrics/constants/pose-capture.constants';
import type { PoseLandmarkPoint } from '@/lib/biometrics/types/pose-measurement.types';
import { Platform, TurboModuleRegistry } from 'react-native';

/** GPU = 1, CPU = 0 (как Delegate в пакете mediapipe). */
const DELEGATE_GPU = 1;
const DELEGATE_CPU = 0;

type NativePoseSlice = {
  landmarks?: PoseLandmarkPoint[][] | undefined;
};

export type NativePoseDetectBundle = {
  inferenceTime?: number | undefined;
  results?: NativePoseSlice[] | undefined;
};

type PoseNativeModule = {
  detectOnImage: (
    imagePath: string,
    numPoses: number,
    minPoseDetectionConfidence: number,
    minPosePresenceConfidence: number,
    minTrackingConfidence: number,
    shouldOutputSegmentationMasks: boolean,
    model: string,
    delegate: number,
  ) => Promise<NativePoseDetectBundle>;
};

export function isMediapipePoseDetectorAvailable(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }
  return TurboModuleRegistry.get('MediapipePosedetection') != null;
}

function getPoseModule(): PoseNativeModule | null {
  const m = TurboModuleRegistry.get('MediapipePosedetection') as PoseNativeModule | null;
  return m ?? null;
}

export function extractFirstPoseLandmarks(
  bundle: NativePoseDetectBundle,
): PoseLandmarkPoint[] | null {
  const layer = bundle.results?.[0]?.landmarks?.[0];
  if (layer == null || layer.length < 33) {
    return null;
  }
  return layer;
}

export async function detectPoseLandmarksFromFile(
  imageUri: string,
): Promise<{ bundle: NativePoseDetectBundle; landmarks: PoseLandmarkPoint[] }> {
  const mod = getPoseModule();
  if (mod == null) {
    throw new Error('Модуль MediapipePosedetection недоступен (нужен dev build с native).');
  }

  const run = (delegate: number) =>
    mod.detectOnImage(imageUri, 1, 0.5, 0.5, 0.5, false, POSE_MODEL_FILENAME, delegate);

  let bundle: NativePoseDetectBundle;
  try {
    bundle = await run(DELEGATE_GPU);
  } catch {
    bundle = await run(DELEGATE_CPU);
  }

  const landmarks = extractFirstPoseLandmarks(bundle);
  if (landmarks == null) {
    throw new Error('Поза на кадре не распознана.');
  }

  return { bundle, landmarks };
}
