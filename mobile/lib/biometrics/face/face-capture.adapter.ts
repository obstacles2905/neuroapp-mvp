import {
  CameraView,
  type CameraPictureOptions,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import {
  FACE_BURST_FRAME_COUNT,
  FACE_BURST_FRAME_DELAY_MS,
} from '@/lib/biometrics/constants/face-capture.constants';
import { poseNormalizeImageOrientation } from '@/lib/biometrics/helpers/pose-image-normalize.helper';
import type {
  FaceFrameSource,
  FacePhaseObservation,
  FaceProtocolPhase,
} from '@/lib/biometrics/types/face-measurement.types';

const CAMERA_PICTURE_OPTIONS: CameraPictureOptions = {
  imageType: 'jpg',
  quality: 1,
  skipProcessing: false,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function requestGalleryPermission(): Promise<boolean> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return perm.granted;
}

export async function pickGalleryImageUri(): Promise<string | null> {
  const granted = await requestGalleryPermission();
  if (!granted) {
    throw new Error('gallery_denied');
  }

  const picked = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (picked.canceled || picked.assets[0]?.uri == null) {
    return null;
  }

  const normalized = await poseNormalizeImageOrientation(picked.assets[0].uri);
  return normalized.uri;
}

export async function captureFaceBurstFromCamera(
  camera: CameraView,
  frameCount: number = FACE_BURST_FRAME_COUNT,
  frameDelayMs: number = FACE_BURST_FRAME_DELAY_MS,
): Promise<string[]> {
  const uris: string[] = [];

  for (let i = 0; i < frameCount; i += 1) {
    const shot = await camera.takePictureAsync(CAMERA_PICTURE_OPTIONS);
    if (shot?.uri == null) {
      throw new Error('camera_capture_failed');
    }
    const normalized = await poseNormalizeImageOrientation(shot.uri);
    uris.push(normalized.uri);
    if (i < frameCount - 1) {
      await delay(frameDelayMs);
    }
  }

  return uris;
}

export async function buildFacePhaseObservation(
  phase: FaceProtocolPhase,
  source: FaceFrameSource,
  frameUris: readonly string[],
): Promise<FacePhaseObservation> {
  if (frameUris.length === 0) {
    throw new Error('empty_phase_frames');
  }

  return {
    frameUris,
    phase,
    source,
  };
}

export function mapFaceCaptureError(code: string): string {
  if (code === 'gallery_denied') {
    return 'Нужен доступ к фото для загрузки из галереи.';
  }
  if (code === 'camera_capture_failed') {
    return 'Не удалось снять кадр с камеры.';
  }
  if (code === 'empty_phase_frames') {
    return 'Нет кадров для анализа фазы.';
  }
  return 'Захват кадра не удался.';
}
