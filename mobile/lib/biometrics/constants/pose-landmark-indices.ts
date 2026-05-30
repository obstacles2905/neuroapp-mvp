/**
 * Индексы совпадают с MediaPipe Pose Landmark (33 ключевые точки).
 * @see https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 */
export const PoseLandmarkIndex = {
  nose: 0,
  leftEyeInner: 1,
  leftEye: 2,
  leftEyeOuter: 3,
  rightEyeInner: 4,
  rightEye: 5,
  rightEyeOuter: 6,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftHip: 23,
  rightHip: 24,
} as const;
