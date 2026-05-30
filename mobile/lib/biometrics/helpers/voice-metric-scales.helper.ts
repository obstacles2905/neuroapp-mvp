import { VOICE_METRIC_SCALE_ROWS } from '@/lib/biometrics/constants/voice-metric-scale.constants';
import {
  labelMonotonyComparison,
  labelPitchComparison,
  labelPitchProfile,
  labelTremorComparison,
  labelVsiComparison,
  comparisonModeHint,
} from '@/lib/biometrics/helpers/voice-core-metrics-copy.helper';
import type { VoiceComparison } from '@/lib/biometrics/types/voice-core-metrics.types';
import type {
  VoiceMeasurementSession,
  VoiceProductMetrics,
} from '@/lib/biometrics/types/voice-measurement.types';

export interface VoiceMetricScaleRowModel {
  comparisonHint?: string | undefined;
  id: string;
  leftLabel: string;
  rightLabel: string;
  title: string;
  value: number;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function metricValue(metrics: VoiceProductMetrics, id: string): number {
  switch (id) {
    case 'confidence':
      return metrics.confidenceScore;
    case 'stability':
      return metrics.vocalStabilityScore;
    case 'tremor':
      return metrics.tremorScore;
    case 'monotonicity':
      return metrics.monotonicityScore;
    case 'tension':
      return metrics.throatTensionScore;
    default:
      return 0;
  }
}

function comparisonHintForScale(
  comparison: VoiceComparison | undefined,
  id: string,
): string | undefined {
  if (comparison == null) {
    return undefined;
  }
  if (comparison.mode === 'first_session_anchor') {
    return undefined;
  }
  switch (id) {
    case 'tremor':
      return labelTremorComparison(comparison.tremor);
    case 'monotonicity':
      return labelMonotonyComparison(comparison.monotony);
    case 'tension':
      return labelVsiComparison(comparison.vsi);
    default:
      return undefined;
  }
}

export function buildVoiceMetricScaleRows(
  session: VoiceMeasurementSession,
): VoiceMetricScaleRowModel[] {
  const { comparison, metrics } = session;

  return VOICE_METRIC_SCALE_ROWS.map((row) => ({
    comparisonHint: comparisonHintForScale(comparison, row.id),
    id: row.id,
    leftLabel: row.leftLabel,
    rightLabel: row.rightLabel,
    title: row.title,
    value: clampPercent(metricValue(metrics, row.id)),
  }));
}

export function buildVoicePitchCaption(session: VoiceMeasurementSession): string | null {
  const core = session.coreMetrics;
  if (core == null) {
    return null;
  }
  const profile = labelPitchProfile(core.pitchProfile);
  const comparison = session.comparison;
  if (comparison == null) {
    return `Тон: ${profile}`;
  }
  return `Тон: ${profile} · ${labelPitchComparison(comparison.pitch)}`;
}

export function buildVoiceSummaryFootnote(session: VoiceMeasurementSession): string | null {
  if (session.comparison == null) {
    return null;
  }
  return comparisonModeHint(session.comparison);
}
