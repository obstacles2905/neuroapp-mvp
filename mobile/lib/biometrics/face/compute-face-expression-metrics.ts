import {
  FACE_ASYMMETRY_PAIRS,
  FACE_GUIDED_PHASE_SHAPES,
  FACE_LOW_EXPRESSIVENESS_THRESHOLD,
  FACE_MIN_DETECTED_RATIO,
  FACE_SCORING_VERSION,
  FACE_TENSION_SHAPES,
} from '@/lib/biometrics/constants/face-scoring.constants';
import { buildFaceInterpretation } from '@/lib/biometrics/face/build-face-interpretation.helper';
import { evaluateFacePhaseCompliance } from '@/lib/biometrics/face/evaluate-face-phase-compliance';
import {
  clampScore0to100,
  meanAsymmetryAcrossPairs,
  meanBlendshapeValues,
  getBlendshapeValue,
} from '@/lib/biometrics/face/face-blendshape.helper';
import type {
  FaceCaptureQualityResult,
  FaceExpressionProductMetrics,
  FacePhaseComplianceResult,
  FacePhaseMetricsSnapshot,
  FaceProtocolPhase,
  FaceSessionInterpretation,
  FaceSessionQualityOverall,
} from '@/lib/biometrics/types/face-measurement.types';

const EXPRESSIVENESS_SCALE = 180;
const TENSION_SCALE = 180;
const ASYMMETRY_SCALE = 320;

function findPhaseSnapshot(
  snapshots: readonly FacePhaseMetricsSnapshot[],
  phase: FaceProtocolPhase,
): FacePhaseMetricsSnapshot | null {
  return snapshots.find((s) => s.phase === phase) ?? null;
}

/**
 * Диапазон мимики: среднее дельт целевых shape'ов guided vs baseline.
 * Считаем по тем же ключам на обеих фазах (не общий «нейтральный» коктейль).
 */
function computeExpressivenessScore(
  snapshots: readonly FacePhaseMetricsSnapshot[],
): number {
  const baseline = findPhaseSnapshot(snapshots, 'baseline');
  if (baseline == null) {
    return 0;
  }

  const deltas: number[] = [];
  const guidedPhases = [
    'guided_smile',
    'guided_frown',
    'guided_surprise',
  ] as const;

  for (const phase of guidedPhases) {
    const snap = findPhaseSnapshot(snapshots, phase);
    if (snap == null) {
      continue;
    }
    const targetShapes = FACE_GUIDED_PHASE_SHAPES[phase];
    const baselineLevel = meanBlendshapeValues(baseline.blendshapes, targetShapes);
    const guidedLevel = meanBlendshapeValues(snap.blendshapes, targetShapes);
    deltas.push(Math.max(0, guidedLevel - baselineLevel));
  }

  if (deltas.length === 0) {
    return 0;
  }

  const meanDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  return clampScore0to100(meanDelta * EXPRESSIVENESS_SCALE);
}

function computeFacialTensionScore(
  snapshots: readonly FacePhaseMetricsSnapshot[],
): number {
  const baseline = findPhaseSnapshot(snapshots, 'baseline');
  if (baseline == null) {
    return 0;
  }

  const press = meanBlendshapeValues(baseline.blendshapes, [
    'mouthPressLeft',
    'mouthPressRight',
  ]);
  const pucker = getBlendshapeValue(baseline.blendshapes, 'mouthPucker');
  const close = getBlendshapeValue(baseline.blendshapes, 'mouthClose');
  const jawOpen = getBlendshapeValue(baseline.blendshapes, 'jawOpen');

  const tensionProxy = press + pucker + close - jawOpen * 0.35;
  const meanTensionShapes = meanBlendshapeValues(
    baseline.blendshapes,
    FACE_TENSION_SHAPES,
  );
  const blended = tensionProxy * 0.65 + meanTensionShapes * 0.35;

  return clampScore0to100(blended * TENSION_SCALE);
}

function computeAsymmetryScore(
  snapshots: readonly FacePhaseMetricsSnapshot[],
): number {
  if (snapshots.length === 0) {
    return 0;
  }

  let sum = 0;
  for (const snap of snapshots) {
    sum += meanAsymmetryAcrossPairs(snap.blendshapes, FACE_ASYMMETRY_PAIRS);
  }
  const meanAsym = sum / snapshots.length;
  return clampScore0to100(meanAsym * ASYMMETRY_SCALE);
}

export function computeFaceExpressionProductMetrics(
  snapshots: readonly FacePhaseMetricsSnapshot[],
): FaceExpressionProductMetrics {
  return {
    asymmetryScore: computeAsymmetryScore(snapshots),
    expressivenessScore: computeExpressivenessScore(snapshots),
    facialTensionScore: computeFacialTensionScore(snapshots),
  };
}

export function getActiveFaceScoringVersion(): string {
  return FACE_SCORING_VERSION;
}

type QualityInput = Readonly<{
  detectedPhases: number;
  expectedPhases: number;
  metrics: FaceExpressionProductMetrics;
  snapshots: readonly FacePhaseMetricsSnapshot[];
}>;

function resolveOverallQuality(
  input: QualityInput,
  compliance: readonly FacePhaseComplianceResult[],
): FaceSessionQualityOverall {
  const ratio = input.detectedPhases / Math.max(1, input.expectedPhases);
  if (ratio < FACE_MIN_DETECTED_RATIO) {
    return 'failed';
  }

  // Явное противоречие шагу не «проваливает» замер — лишь мягко предлагаем пересъём.
  const hasContradiction = compliance.some((c) => !c.matched);
  if (hasContradiction) {
    return 'retry_suggested';
  }

  if (input.metrics.expressivenessScore < FACE_LOW_EXPRESSIVENESS_THRESHOLD) {
    return 'retry_suggested';
  }
  return 'ok';
}

export function buildFaceCaptureQuality(
  input: QualityInput,
): FaceCaptureQualityResult {
  const ratio = input.detectedPhases / Math.max(1, input.expectedPhases);
  const failureReasons: string[] = [];
  const retryHints: string[] = [];
  const phaseCompliance = evaluateFacePhaseCompliance(input.snapshots);

  if (ratio < FACE_MIN_DETECTED_RATIO) {
    failureReasons.push('face_not_detected_enough');
    retryHints.push('Лицо не видно на достаточной доле кадров — проверь свет и ракурс.');
  }

  for (const item of phaseCompliance) {
    if (item.matched || item.reasonCode == null || item.retryHint == null) {
      continue;
    }
    failureReasons.push(item.reasonCode);
    retryHints.push(item.retryHint);
  }

  if (
    input.metrics.expressivenessScore < FACE_LOW_EXPRESSIVENESS_THRESHOLD &&
    phaseCompliance.every((c) => c.matched)
  ) {
    failureReasons.push('low_expressiveness');
    retryHints.push(
      'Мимика почти не меняется между шагами — попробуй выразить эмоции чуть ярче.',
    );
  }

  const overall = resolveOverallQuality(input, phaseCompliance);

  return {
    failureReasons,
    faceDetectedRatio: Math.round(ratio * 1000) / 1000,
    overall,
    phaseCompliance,
    retryHints,
  };
}

export function recomputeFaceMetricsFromSnapshots(
  snapshots: readonly FacePhaseMetricsSnapshot[],
  expectedPhases: number,
): {
  interpretation: FaceSessionInterpretation;
  metrics: FaceExpressionProductMetrics;
  quality: FaceCaptureQualityResult;
  scoringVersion: string;
} {
  const metrics = computeFaceExpressionProductMetrics(snapshots);
  const quality = buildFaceCaptureQuality({
    detectedPhases: snapshots.length,
    expectedPhases,
    metrics,
    snapshots,
  });

  return {
    interpretation: buildFaceInterpretation(metrics, quality),
    metrics,
    quality,
    scoringVersion: getActiveFaceScoringVersion(),
  };
}
