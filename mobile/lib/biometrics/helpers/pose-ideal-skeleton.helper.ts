import { POSE_LANDMARK_MIN_VISIBILITY } from '@/lib/biometrics/constants/pose-capture.constants';
import { PoseLandmarkIndex } from '@/lib/biometrics/constants/pose-landmark-indices';
import { resolveProfileAnchors } from '@/lib/biometrics/compute-pose-numeric-rows';
import type {
  PoseCaptureViewKind,
  PoseLandmarkPoint,
} from '@/lib/biometrics/types/pose-measurement.types';

/**
 * Точка идеального скелета в той же нормированной системе координат, что и MediaPipe-ландмарки
 * нормализованного кадра (`x, y ∈ [0, 1]`).
 */
export type PoseIdealPoint = Readonly<{ x: number; y: number }>;

/** Ребро идеального скелета: пара точек (без topology-индексов — оверлей рисует напрямую). */
export type PoseIdealEdge = Readonly<{ a: PoseIdealPoint; b: PoseIdealPoint }>;

export type PoseIdealSkeleton = Readonly<{
  edges: ReadonlyArray<PoseIdealEdge>;
  joints: ReadonlyArray<PoseIdealPoint>;
}>;

function vis(p: PoseLandmarkPoint | undefined): number {
  if (p == null) {
    return 0;
  }
  return p.visibility ?? p.presence ?? 1;
}

function visible(p: PoseLandmarkPoint | undefined): boolean {
  return vis(p) >= POSE_LANDMARK_MIN_VISIBILITY;
}

/**
 * Frontal: целевая поза — голова прямо над серединой плеч, плечи строго горизонтальны,
 * таз строго горизонтален, корпус по вертикали через середину плеч/таза.
 * Ширина плеч/таза берётся от пользователя, чтобы каркас визуально лежал на нём.
 */
function buildFrontalIdealSkeleton(landmarks: PoseLandmarkPoint[]): PoseIdealSkeleton | null {
  const ls = landmarks[PoseLandmarkIndex.leftShoulder];
  const rs = landmarks[PoseLandmarkIndex.rightShoulder];
  const lh = landmarks[PoseLandmarkIndex.leftHip];
  const rh = landmarks[PoseLandmarkIndex.rightHip];
  const nose = landmarks[PoseLandmarkIndex.nose];

  if (!visible(ls) || !visible(rs) || !visible(lh) || !visible(rh) || ls == null || rs == null || lh == null || rh == null) {
    return null;
  }

  const shoulderMidX = (ls.x + rs.x) / 2;
  const shoulderY = (ls.y + rs.y) / 2;
  const halfShoulderWidth = Math.abs(rs.x - ls.x) / 2;

  const hipMidX = (lh.x + rh.x) / 2;
  const hipY = (lh.y + rh.y) / 2;
  const halfHipWidth = Math.abs(rh.x - lh.x) / 2;

  const idealSpineX = (shoulderMidX + hipMidX) / 2;

  const leftShoulder: PoseIdealPoint = { x: idealSpineX - halfShoulderWidth, y: shoulderY };
  const rightShoulder: PoseIdealPoint = { x: idealSpineX + halfShoulderWidth, y: shoulderY };
  const leftHip: PoseIdealPoint = { x: idealSpineX - halfHipWidth, y: hipY };
  const rightHip: PoseIdealPoint = { x: idealSpineX + halfHipWidth, y: hipY };

  const head: PoseIdealPoint | null = visible(nose) && nose != null ? { x: idealSpineX, y: nose.y } : null;

  const joints: PoseIdealPoint[] = [leftShoulder, rightShoulder, leftHip, rightHip];
  const edges: PoseIdealEdge[] = [
    { a: leftShoulder, b: rightShoulder },
    { a: leftHip, b: rightHip },
    { a: leftShoulder, b: leftHip },
    { a: rightShoulder, b: rightHip },
  ];

  if (head != null) {
    joints.push(head);
    edges.push({ a: head, b: { x: idealSpineX, y: shoulderY } });
  }

  return { edges, joints };
}

/**
 * Profile: ухо/нос строго над плечом, плечо строго над серединой таза (вертикальная «стопка»).
 * X-координата всех точек выровнена по X плеча пользователя (рабочая видимая сторона),
 * Y — у каждой точки своя (фактическая высота уха/плеча/таза).
 */
function buildProfileIdealSkeleton(landmarks: PoseLandmarkPoint[]): PoseIdealSkeleton | null {
  const anchors = resolveProfileAnchors(landmarks);
  if (anchors == null) {
    return null;
  }

  const { ear, hipMid, shoulder } = anchors.head;
  const stackX = shoulder.x;

  const idealEar: PoseIdealPoint = { x: stackX, y: ear.y };
  const idealShoulder: PoseIdealPoint = { x: stackX, y: shoulder.y };
  const idealHip: PoseIdealPoint = { x: stackX, y: hipMid.y };

  return {
    edges: [
      { a: idealEar, b: idealShoulder },
      { a: idealShoulder, b: idealHip },
    ],
    joints: [idealEar, idealShoulder, idealHip],
  };
}

export function buildIdealSkeleton(
  viewKind: PoseCaptureViewKind,
  landmarks: PoseLandmarkPoint[],
): PoseIdealSkeleton | null {
  if (viewKind === 'profile') {
    return buildProfileIdealSkeleton(landmarks);
  }
  return buildFrontalIdealSkeleton(landmarks);
}
