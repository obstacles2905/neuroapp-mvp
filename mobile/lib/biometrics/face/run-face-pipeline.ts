import {
  FACE_PIPELINE_MODEL_ID,
  FACE_PIPELINE_MODEL_VERSION,
  FACE_PROTOCOL_VERSION,
} from '@/lib/biometrics/constants/face-capture.constants';
import { FACE_PROTOCOL_PHASE_ORDER } from '@/lib/biometrics/constants/face-capture.constants';
import { buildFaceInterpretation } from '@/lib/biometrics/face/build-face-interpretation.helper';
import {
  buildFaceCaptureQuality,
  computeFaceExpressionProductMetrics,
  getActiveFaceScoringVersion,
} from '@/lib/biometrics/face/compute-face-expression-metrics';
import { meanBlendshapeValues } from '@/lib/biometrics/face/face-blendshape.helper';
import {
  detectFaceBlendshapesFromFile,
  isNeuroFaceLandmarkerAvailable,
} from '@/lib/biometrics/mediapipe/detect-face-on-image';
import type {
  FaceBlendshapeFrame,
  FaceBlendshapeMap,
  FaceExpressionMeasurementSession,
  FacePhaseMetricsSnapshot,
  FacePhaseObservation,
} from '@/lib/biometrics/types/face-measurement.types';

type FrameCandidate = Readonly<{
  blendshapes: FaceBlendshapeMap;
  frameHeight: number;
  frameUri: string;
  frameWidth: number;
  inferenceMs: number;
  signalStrength: number;
}>;

function signalStrengthFromBlendshapes(map: FaceBlendshapeMap): number {
  const keys = Object.keys(map);
  if (keys.length === 0) {
    return 0;
  }
  return meanBlendshapeValues(map, keys);
}

async function bestFrameForPhase(
  observation: FacePhaseObservation,
): Promise<FaceBlendshapeFrame | null> {
  const candidates: FrameCandidate[] = [];

  for (const frameUri of observation.frameUris) {
    try {
      const detected = await detectFaceBlendshapesFromFile(frameUri);
      const frameHeight = detected.bundle.inputImageHeight ?? 0;
      const frameWidth = detected.bundle.inputImageWidth ?? 0;
      candidates.push({
        blendshapes: detected.blendshapes,
        frameHeight,
        frameUri,
        frameWidth,
        inferenceMs: detected.inferenceMs,
        signalStrength: signalStrengthFromBlendshapes(detected.blendshapes),
      });
    } catch {
      // пробуем остальные кадры burst
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const best = candidates.reduce((acc, cur) =>
    cur.signalStrength > acc.signalStrength ? cur : acc,
  );

  return {
    blendshapes: best.blendshapes,
    frameHeight: best.frameHeight,
    frameUri: best.frameUri,
    frameWidth: best.frameWidth,
    inferenceMs: best.inferenceMs,
    phase: observation.phase,
    source: observation.source,
  };
}

export function isFaceMeasurementPipelineAvailable(): boolean {
  return isNeuroFaceLandmarkerAvailable();
}

export async function runFaceMeasurementPipeline(input: {
  capturedAt: string;
  observations: readonly FacePhaseObservation[];
  sessionId: string;
}): Promise<FaceExpressionMeasurementSession> {
  if (!isNeuroFaceLandmarkerAvailable()) {
    throw new Error('native_face_landmarker_unavailable');
  }

  const frames: FaceBlendshapeFrame[] = [];

  for (const observation of input.observations) {
    const frame = await bestFrameForPhase(observation);
    if (frame != null) {
      frames.push(frame);
    }
  }

  const phaseSnapshots: FacePhaseMetricsSnapshot[] = frames.map((frame) => ({
    blendshapes: frame.blendshapes,
    phase: frame.phase,
  }));

  const metrics = computeFaceExpressionProductMetrics(phaseSnapshots);
  const quality = buildFaceCaptureQuality({
    detectedPhases: phaseSnapshots.length,
    expectedPhases: FACE_PROTOCOL_PHASE_ORDER.length,
    metrics,
    snapshots: phaseSnapshots,
  });
  const interpretation = buildFaceInterpretation(metrics, quality);

  return {
    capturedAt: input.capturedAt,
    extractorId: 'mediapipe-face-landmarker',
    extractorVersion: FACE_PIPELINE_MODEL_VERSION,
    id: input.sessionId,
    interpretation,
    metrics,
    phaseSnapshots,
    protocolVersion: FACE_PROTOCOL_VERSION,
    quality,
    scoringVersion: getActiveFaceScoringVersion(),
  };
}

export function mapFacePipelineError(code: string): string {
  if (code === 'native_face_landmarker_unavailable') {
    return 'Нативный модуль мимики недоступен. Соберите development build (Expo Go не поддерживает Face Landmarker).';
  }
  return 'Анализ мимики не удался.';
}

export function facePipelineModelMeta(): { modelId: string; modelVersion: string } {
  return {
    modelId: FACE_PIPELINE_MODEL_ID,
    modelVersion: FACE_PIPELINE_MODEL_VERSION,
  };
}
