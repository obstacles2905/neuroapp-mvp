import { POSE_LANDMARK_MIN_VISIBILITY } from '@/lib/biometrics/constants/pose-capture.constants';
import { PoseLandmarkIndex } from '@/lib/biometrics/constants/pose-landmark-indices';
import type {
  PoseLandmarkPoint,
  PoseProductMetrics,
} from '@/lib/biometrics/types/pose-measurement.types';

const DEG = 180 / Math.PI;

function landmarkVis(point: PoseLandmarkPoint | undefined): number {
  if (point == null) {
    return 0;
  }
  return point.visibility ?? point.presence ?? 1;
}

export function computePoseProductMetrics(
  landmarks: PoseLandmarkPoint[],
): PoseProductMetrics {
  const nose = landmarks[PoseLandmarkIndex.nose];
  const ls = landmarks[PoseLandmarkIndex.leftShoulder];
  const rs = landmarks[PoseLandmarkIndex.rightShoulder];
  const lh = landmarks[PoseLandmarkIndex.leftHip];
  const rh = landmarks[PoseLandmarkIndex.rightHip];

  const qN = landmarkVis(nose);
  const qLs = landmarkVis(ls);
  const qRs = landmarkVis(rs);
  const qLh = landmarkVis(lh);
  const qRh = landmarkVis(rh);

  const frameQualityScore = Math.min(qN, qLs, qRs, qLh, qRh);

  const shouldersOk = qLs >= POSE_LANDMARK_MIN_VISIBILITY && qRs >= POSE_LANDMARK_MIN_VISIBILITY;
  const headOk = qN >= POSE_LANDMARK_MIN_VISIBILITY && shouldersOk;

  let headTiltDeg: number | null = null;
  if (headOk && nose != null && ls != null && rs != null) {
    const smx = (ls.x + rs.x) / 2;
    const smy = (ls.y + rs.y) / 2;
    const vx = nose.x - smx;
    const vy = nose.y - smy;
    headTiltDeg = Math.atan2(vx, -vy) * DEG;
  }

  let shoulderLineTiltDeg: number | null = null;
  let shoulderAsymmetryProxy: number | null = null;
  if (shouldersOk && ls != null && rs != null) {
    shoulderLineTiltDeg = Math.atan2(rs.y - ls.y, rs.x - ls.x) * DEG;
    shoulderAsymmetryProxy = Math.abs(rs.y - ls.y) * 100;
  }

  return {
    avgInferenceMs: null,
    frameQualityScore,
    headTiltDeg,
    shoulderAsymmetryProxy,
    shoulderLineTiltDeg,
  };
}
