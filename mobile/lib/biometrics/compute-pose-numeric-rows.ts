import { POSE_LANDMARK_MIN_VISIBILITY } from '@/lib/biometrics/constants/pose-capture.constants';
import { PoseLandmarkIndex } from '@/lib/biometrics/constants/pose-landmark-indices';
import { POSE_NUMERIC_IDEALS } from '@/lib/biometrics/constants/pose-numeric-ideals.constants';
import type {
  PoseLandmarkPoint,
  PoseNumericMetricRow,
  PoseProductMetrics,
} from '@/lib/biometrics/types/pose-measurement.types';

const DEG = 180 / Math.PI;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function landmarkVis(point: PoseLandmarkPoint | undefined): number {
  if (point == null) {
    return 0;
  }
  return point.visibility ?? point.presence ?? 1;
}

function angleAtDegrees(a: PoseLandmarkPoint, b: PoseLandmarkPoint, c: PoseLandmarkPoint): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  if (m1 < 1e-9 || m2 < 1e-9) {
    return NaN;
  }
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return Math.acos(cos) * DEG;
}

/** Магнитуда угла линии (x0,y0)→(x1,y1) к вертикали кадра, ° ∈ [0, 90]. */
function magnitudeAngleToVerticalDeg(x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  if (Math.hypot(dx, dy) < 1e-9) {
    return NaN;
  }
  const ang = Math.atan2(dx, -dy) * DEG;
  return Math.abs(ang);
}

/**
 * Магнитуда угла линии (x0,y0)→(x1,y1) к горизонтали кадра, ° ∈ [0, 90].
 * Безразлична к тому, какая точка «слева» — поэтому корректно работает и на немиррорных селфи,
 * где MediaPipe-индексы 11/12 (анатомически левое/правое) попадают на противоположные стороны кадра.
 */
function magnitudeAngleToHorizontalDeg(x0: number, y0: number, x1: number, y1: number): number {
  const dy = y1 - y0;
  const dx = x1 - x0;
  if (Math.hypot(dx, dy) < 1e-9) {
    return NaN;
  }
  return Math.abs(Math.atan2(Math.abs(dy), Math.abs(dx)) * DEG);
}

function row(
  viewKind: 'frontal' | 'profile',
  code: string,
  label: string,
  value: number,
  idealKey: keyof typeof POSE_NUMERIC_IDEALS,
  unit?: string | undefined,
): PoseNumericMetricRow | null {
  if (Number.isNaN(value)) {
    return null;
  }
  const idealRaw = POSE_NUMERIC_IDEALS[idealKey];
  const ideal = typeof idealRaw === 'number' ? idealRaw : 0;
  const v = round1(value);
  const id = round1(ideal);
  return {
    code,
    deviation: round1(v - id),
    ideal: id,
    label,
    unit,
    value: v,
    viewKind,
  };
}

export function computeProfileFrameMetrics(landmarks: PoseLandmarkPoint[]): PoseProductMetrics {
  const parsed = resolveProfileAnchors(landmarks);
  if (parsed == null) {
    return {
      avgInferenceMs: null,
      frameQualityScore: 0,
      headTiltDeg: null,
      shoulderLineTiltDeg: null,
      shoulderAsymmetryProxy: null,
    };
  }

  const { ear, hipMid, nose, shoulder } = parsed.head;
  const qPoints = nose != null ? [shoulder, ear, nose, hipMid] : [shoulder, ear, hipMid];
  const qs = qPoints.map((p) => landmarkVis(p));
  const frameQualityScore = qs.length > 0 ? Math.min(...qs) : 0;

  return {
    avgInferenceMs: null,
    frameQualityScore,
    headTiltDeg: null,
    shoulderLineTiltDeg: null,
    shoulderAsymmetryProxy: null,
  };
}

export function buildFrontalNumericRows(landmarks: PoseLandmarkPoint[]): PoseNumericMetricRow[] {
  const ls = landmarks[PoseLandmarkIndex.leftShoulder];
  const rs = landmarks[PoseLandmarkIndex.rightShoulder];
  const lh = landmarks[PoseLandmarkIndex.leftHip];
  const rh = landmarks[PoseLandmarkIndex.rightHip];
  const nose = landmarks[PoseLandmarkIndex.nose];

  const qLs = landmarkVis(ls);
  const qRs = landmarkVis(rs);
  const qLh = landmarkVis(lh);
  const qRh = landmarkVis(rh);
  const qN = landmarkVis(nose);
  const minVis = Math.min(qN, qLs, qRs, qLh, qRh);

  const rows: PoseNumericMetricRow[] = [];

  const visRow = row(
    'frontal',
    'frontal_min_visibility',
    'Мин. visibility ключевых точек MediaPipe (анфас)',
    minVis,
    'frontal_min_visibility',
  );
  if (visRow != null) {
    rows.push(visRow);
  }

  const shouldersOk =
    ls != null && rs != null && qLs >= POSE_LANDMARK_MIN_VISIBILITY && qRs >= POSE_LANDMARK_MIN_VISIBILITY;
  const hipsOk =
    lh != null && rh != null && qLh >= POSE_LANDMARK_MIN_VISIBILITY && qRh >= POSE_LANDMARK_MIN_VISIBILITY;

  let shoulderTiltMag: number | null = null;
  let hipTiltMag: number | null = null;

  if (shouldersOk) {
    const asym = Math.abs(rs.y - ls.y) * 100;
    const h1 = row(
      'frontal',
      'frontal_shoulder_dy_asymmetry',
      '|ΔY правое−левое плечо|×100',
      asym,
      'frontal_shoulder_dy_asymmetry',
    );
    if (h1 != null) {
      rows.push(h1);
    }
    shoulderTiltMag = magnitudeAngleToHorizontalDeg(ls.x, ls.y, rs.x, rs.y);
    const h2 = row(
      'frontal',
      'frontal_shoulder_line_tilt_deg',
      'Наклон линии плечевого пояса к горизонтали кадра, ° (магнитуда)',
      shoulderTiltMag,
      'frontal_shoulder_line_tilt_deg',
      '°',
    );
    if (h2 != null) {
      rows.push(h2);
    }
  }

  if (hipsOk) {
    const hipAsym = Math.abs(rh.y - lh.y) * 100;
    const h = row(
      'frontal',
      'frontal_hip_dy_asymmetry',
      '|ΔY таз правый−левый|×100',
      hipAsym,
      'frontal_hip_dy_asymmetry',
    );
    if (h != null) {
      rows.push(h);
    }
    hipTiltMag = magnitudeAngleToHorizontalDeg(lh.x, lh.y, rh.x, rh.y);
  }

  if (shouldersOk && hipsOk && shoulderTiltMag != null && hipTiltMag != null) {
    const diff = Math.abs(shoulderTiltMag - hipTiltMag);
    const h = row(
      'frontal',
      'frontal_shoulder_hip_parallelism_deg',
      '|Δ наклона плеч и таза|, ° — перекос таза относительно плечевого пояса',
      diff,
      'frontal_shoulder_hip_parallelism_deg',
      '°',
    );
    if (h != null) {
      rows.push(h);
    }

    const midSx = (ls.x + rs.x) / 2;
    const midSy = (ls.y + rs.y) / 2;
    const midHx = (lh.x + rh.x) / 2;
    const midHy = (lh.y + rh.y) / 2;
    const lean = magnitudeAngleToVerticalDeg(midHx, midHy, midSx, midSy);
    const hl = row(
      'frontal',
      'frontal_trunk_lean_deg',
      'Наклон корпуса вбок: угол «середина таз → середина плеч» к вертикали, ° (магнитуда)',
      lean,
      'frontal_trunk_lean_deg',
      '°',
    );
    if (hl != null) {
      rows.push(hl);
    }
  }

  if (nose != null && shouldersOk && qN >= POSE_LANDMARK_MIN_VISIBILITY) {
    const smx = (ls.x + rs.x) / 2;
    const smy = (ls.y + rs.y) / 2;
    const headTilt = magnitudeAngleToVerticalDeg(smx, smy, nose.x, nose.y);
    const h = row(
      'frontal',
      'frontal_head_tilt_deg',
      'Наклон головы вбок: угол «середина плеч → нос» к вертикали, ° (магнитуда)',
      headTilt,
      'frontal_head_tilt_deg',
      '°',
    );
    if (h != null) {
      rows.push(h);
    }
  }

  return rows;
}

type ProfileAnchors = Readonly<{
  head: {
    ear: PoseLandmarkPoint;
    hipMid: PoseLandmarkPoint;
    nose: PoseLandmarkPoint | null;
    shoulder: PoseLandmarkPoint;
  };
  side: 'left' | 'right';
}>;

export function resolveProfileAnchors(
  landmarks: PoseLandmarkPoint[],
): ProfileAnchors | null {
  const ls = landmarks[PoseLandmarkIndex.leftShoulder];
  const rs = landmarks[PoseLandmarkIndex.rightShoulder];
  const lh = landmarks[PoseLandmarkIndex.leftHip];
  const rh = landmarks[PoseLandmarkIndex.rightHip];
  const le = landmarks[PoseLandmarkIndex.leftEar];
  const re = landmarks[PoseLandmarkIndex.rightEar];
  const nose = landmarks[PoseLandmarkIndex.nose];

  if (lh == null || rh == null) {
    return null;
  }

  const hipMid: PoseLandmarkPoint = {
    x: (lh.x + rh.x) / 2,
    y: (lh.y + rh.y) / 2,
    z: (lh.z + rh.z) / 2,
  };

  const scoreLeft = landmarkVis(ls) + landmarkVis(lh) + landmarkVis(le);
  const scoreRight = landmarkVis(rs) + landmarkVis(rh) + landmarkVis(re);

  let side: 'left' | 'right' = scoreLeft >= scoreRight ? 'left' : 'right';

  let shoulder = side === 'left' ? ls : rs;
  if (shoulder == null) {
    shoulder = side === 'left' ? rs : ls;
    side = shoulder === ls ? 'left' : 'right';
  }
  if (shoulder == null) {
    return null;
  }

  const rawEar = side === 'left' ? le : re;

  let earPoint: PoseLandmarkPoint | null =
    landmarkVis(rawEar) >= POSE_LANDMARK_MIN_VISIBILITY && rawEar != null ? rawEar : null;

  if (earPoint == null && nose != null && landmarkVis(nose) >= POSE_LANDMARK_MIN_VISIBILITY) {
    earPoint = nose;
  }

  if (earPoint == null || landmarkVis(shoulder) < POSE_LANDMARK_MIN_VISIBILITY) {
    return null;
  }

  return {
    head: { ear: earPoint, hipMid, nose: nose ?? null, shoulder },
    side,
  };
}

export function buildProfileNumericRows(landmarks: PoseLandmarkPoint[]): PoseNumericMetricRow[] {
  const parsed = resolveProfileAnchors(landmarks);
  const rows: PoseNumericMetricRow[] = [];

  if (parsed == null) {
    return rows;
  }

  const { ear, hipMid, shoulder } = parsed.head;
  const qMin = Math.min(landmarkVis(ear), landmarkVis(shoulder), landmarkVis(hipMid));
  const visRow = row(
    'profile',
    'profile_min_visibility',
    'Мин. visibility опорных точек (профиль)',
    qMin,
    'profile_min_visibility',
  );
  if (visRow != null) {
    rows.push(visRow);
  }

  // Только горизонтальная компонента: вертикальный зазор «голова над плечом» не несёт смысла FHP.
  const shift = Math.abs(ear.x - shoulder.x) * 100;
  const shiftRow = row(
    'profile',
    'profile_ear_forward_shift',
    'Горизонтальное смещение «ухо/нос вперёд относительно плеча», ×100',
    shift,
    'profile_ear_forward_shift',
  );
  if (shiftRow != null) {
    rows.push(shiftRow);
  }

  const ctAngle = angleAtDegrees(hipMid, shoulder, ear);
  const ctRow = row(
    'profile',
    'profile_shoulder_cervico_thoracic_angle',
    'Угол «таз–плечо–ухо», ° — прокси сутулости / «холки» по кадру (не рентген)',
    ctAngle,
    'profile_shoulder_cervico_thoracic_angle',
    '°',
  );
  if (ctRow != null) {
    rows.push(ctRow);
  }

  const headStack = magnitudeAngleToVerticalDeg(shoulder.x, shoulder.y, ear.x, ear.y);
  const hsRow = row(
    'profile',
    'profile_head_stack_angle',
    'Угол линии «плечо–ухо/нос» к вертикали кадра, ° (магнитуда)',
    headStack,
    'profile_head_stack_angle',
    '°',
  );
  if (hsRow != null) {
    rows.push(hsRow);
  }

  const trunkLean = magnitudeAngleToVerticalDeg(hipMid.x, hipMid.y, shoulder.x, shoulder.y);
  const tlRow = row(
    'profile',
    'profile_trunk_lean_deg',
    'Угол линии «середина таз → плечо» к вертикали кадра, ° (магнитуда)',
    trunkLean,
    'profile_trunk_lean_deg',
    '°',
  );
  if (tlRow != null) {
    rows.push(tlRow);
  }

  return rows;
}
