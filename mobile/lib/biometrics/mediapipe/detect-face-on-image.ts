import { Platform, TurboModuleRegistry } from 'react-native';

import { FACE_MODEL_FILENAME } from '@/lib/biometrics/constants/face-capture.constants';
import { blendshapeScoresToMap } from '@/lib/biometrics/face/face-blendshape.helper';
import type {
  FaceBlendshapeMap,
  FaceBlendshapeScore,
} from '@/lib/biometrics/types/face-measurement.types';

/** GPU = 1, CPU = 0 (как Delegate в пакете mediapipe). */
const DELEGATE_GPU = 1;
const DELEGATE_CPU = 0;

type NativeClassificationCategory = {
  categoryName?: string | undefined;
  score?: number | undefined;
};

type NativeClassifications = {
  categories?: NativeClassificationCategory[] | undefined;
};

type NativeFaceSlice = {
  faceBlendshapes?: NativeClassifications[] | undefined;
};

export type NativeFaceDetectBundle = {
  inferenceTime?: number | undefined;
  inputImageHeight?: number | undefined;
  inputImageWidth?: number | undefined;
  results?: NativeFaceSlice[] | undefined;
};

type FaceNativeModule = {
  detectOnImage: (
    imagePath: string,
    numFaces: number,
    minFaceDetectionConfidence: number,
    minFacePresenceConfidence: number,
    minTrackingConfidence: number,
    model: string,
    delegate: number,
  ) => Promise<NativeFaceDetectBundle>;
};

export function isNeuroFaceLandmarkerAvailable(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }
  return TurboModuleRegistry.get('NeuroFaceLandmarker') != null;
}

function getFaceModule(): FaceNativeModule | null {
  const m = TurboModuleRegistry.get('NeuroFaceLandmarker') as FaceNativeModule | null;
  return m ?? null;
}

function extractBlendshapeScores(
  bundle: NativeFaceDetectBundle,
): FaceBlendshapeScore[] | null {
  const classifications = bundle.results?.[0]?.faceBlendshapes?.[0];
  const categories = classifications?.categories;
  if (categories == null || categories.length === 0) {
    return null;
  }

  const scores: FaceBlendshapeScore[] = [];
  for (const cat of categories) {
    if (cat.categoryName == null && cat.score == null) {
      continue;
    }
    const name = cat.categoryName ?? (cat as { label?: string }).label;
    if (name == null || cat.score == null) {
      continue;
    }
    scores.push({
      categoryName: name,
      score: cat.score,
    });
  }

  return scores.length > 0 ? scores : null;
}

export async function detectFaceBlendshapesFromFile(
  imageUri: string,
): Promise<{
  blendshapes: FaceBlendshapeMap;
  bundle: NativeFaceDetectBundle;
  inferenceMs: number;
}> {
  const mod = getFaceModule();
  if (mod == null) {
    throw new Error(
      'Модуль NeuroFaceLandmarker недоступен (нужен dev build с native face landmarker).',
    );
  }

  const run = (delegate: number) =>
    mod.detectOnImage(imageUri, 1, 0.5, 0.5, 0.5, FACE_MODEL_FILENAME, delegate);

  let bundle: NativeFaceDetectBundle;
  try {
    bundle = await run(DELEGATE_GPU);
  } catch {
    bundle = await run(DELEGATE_CPU);
  }

  const rawScores = extractBlendshapeScores(bundle);
  if (rawScores == null) {
    throw new Error('Лицо на кадре не распознано.');
  }

  return {
    blendshapes: blendshapeScoresToMap(rawScores),
    bundle,
    inferenceMs: bundle.inferenceTime ?? 0,
  };
}
