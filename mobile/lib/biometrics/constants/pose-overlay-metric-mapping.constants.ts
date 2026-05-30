import { PoseLandmarkIndex } from '@/lib/biometrics/constants/pose-landmark-indices';
import type { PoseCaptureViewKind } from '@/lib/biometrics/types/pose-measurement.types';

type ProfileAnchors = Readonly<{
  side: 'left' | 'right';
}>;

/**
 * Знаменатель для |deviation| → «тяжесть» подсветки ребра (больше = слабее реакция).
 * Калиброваны так, чтобы при «обычно плохо» severity ≈ 0.5–0.7, а при «реально плохо» приближалась к 1.
 */
export const POSE_OVERLAY_METRIC_DENOM: Readonly<Record<string, number>> = {
  frontal_head_tilt_deg: 6,
  frontal_shoulder_dy_asymmetry: 6,
  frontal_shoulder_line_tilt_deg: 5,
  frontal_hip_dy_asymmetry: 6,
  frontal_trunk_lean_deg: 5,
  frontal_shoulder_hip_parallelism_deg: 5,
  profile_ear_forward_shift: 8,
  profile_head_stack_angle: 12,
  profile_shoulder_cervico_thoracic_angle: 10,
  profile_trunk_lean_deg: 8,
};

const FRONTAL_METRIC_EDGES: Readonly<Record<string, ReadonlyArray<readonly [number, number]>>> = {
  frontal_head_tilt_deg: [
    [PoseLandmarkIndex.nose, PoseLandmarkIndex.leftShoulder],
    [PoseLandmarkIndex.nose, PoseLandmarkIndex.rightShoulder],
  ],
  frontal_shoulder_dy_asymmetry: [[PoseLandmarkIndex.leftShoulder, PoseLandmarkIndex.rightShoulder]],
  frontal_shoulder_line_tilt_deg: [[PoseLandmarkIndex.leftShoulder, PoseLandmarkIndex.rightShoulder]],
  frontal_hip_dy_asymmetry: [[PoseLandmarkIndex.leftHip, PoseLandmarkIndex.rightHip]],
  frontal_trunk_lean_deg: [
    [PoseLandmarkIndex.leftShoulder, PoseLandmarkIndex.leftHip],
    [PoseLandmarkIndex.rightShoulder, PoseLandmarkIndex.rightHip],
  ],
  frontal_shoulder_hip_parallelism_deg: [
    [PoseLandmarkIndex.leftShoulder, PoseLandmarkIndex.rightShoulder],
    [PoseLandmarkIndex.leftHip, PoseLandmarkIndex.rightHip],
  ],
};

export function landmarkEdgeKey(a: number, b: number): string {
  return a <= b ? `${String(a)}_${String(b)}` : `${String(b)}_${String(a)}`;
}

export function overlayEdgesForMetric(
  code: string,
  viewKind: PoseCaptureViewKind,
  profile: ProfileAnchors | null,
): ReadonlyArray<readonly [number, number]> {
  if (code.endsWith('_min_visibility')) {
    return [];
  }
  if (viewKind === 'frontal') {
    return FRONTAL_METRIC_EDGES[code] ?? [];
  }

  const shoulderIdx = profile?.side === 'left' ? PoseLandmarkIndex.leftShoulder : PoseLandmarkIndex.rightShoulder;
  const earIdx = profile?.side === 'left' ? PoseLandmarkIndex.leftEar : PoseLandmarkIndex.rightEar;

  switch (code) {
    case 'profile_ear_forward_shift':
      return [[earIdx, shoulderIdx]];
    case 'profile_shoulder_cervico_thoracic_angle':
      return [
        [earIdx, shoulderIdx],
        [shoulderIdx, PoseLandmarkIndex.leftHip],
        [shoulderIdx, PoseLandmarkIndex.rightHip],
      ];
    case 'profile_head_stack_angle':
      return [[earIdx, shoulderIdx]];
    case 'profile_trunk_lean_deg':
      return [
        [shoulderIdx, PoseLandmarkIndex.leftHip],
        [shoulderIdx, PoseLandmarkIndex.rightHip],
      ];
    default:
      return [];
  }
}
