import {
  POSE_OVERLAY_METRIC_DENOM,
  landmarkEdgeKey,
  overlayEdgesForMetric,
} from '@/lib/biometrics/constants/pose-overlay-metric-mapping.constants';
import { resolveProfileAnchors } from '@/lib/biometrics/compute-pose-numeric-rows';
import type {
  PoseCaptureViewKind,
  PoseLandmarkPoint,
  PoseNumericMetricRow,
} from '@/lib/biometrics/types/pose-measurement.types';

export function overlaySeverityFromDeviation(code: string, deviationAbs: number): number {
  const denom = POSE_OVERLAY_METRIC_DENOM[code] != null ? POSE_OVERLAY_METRIC_DENOM[code] : 12;
  if (denom <= 0) {
    return 0;
  }
  const raw = deviationAbs / denom;
  return Math.max(0, Math.min(1, raw));
}

export function overlayBuildSeverityByEdgeKey(
  viewKind: PoseCaptureViewKind,
  numericRows: PoseNumericMetricRow[],
  landmarks: PoseLandmarkPoint[],
): Map<string, number> {
  const profileAnchors =
    viewKind === 'profile' ? resolveProfileAnchors(landmarks) : null;
  const anchorsForMap =
    profileAnchors != null ? { side: profileAnchors.side } : null;
  const byEdge = new Map<string, number>();
  for (const row of numericRows) {
    if (row.code.endsWith('_min_visibility')) {
      continue;
    }
    const severity = overlaySeverityFromDeviation(row.code, Math.abs(row.deviation));
    const edges = overlayEdgesForMetric(row.code, viewKind, anchorsForMap);
    for (const [a, b] of edges) {
      const k = landmarkEdgeKey(a, b);
      const prev = byEdge.get(k) ?? 0;
      byEdge.set(k, Math.max(prev, severity));
    }
  }
  return byEdge;
}
