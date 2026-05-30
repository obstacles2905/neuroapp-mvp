import type {
  VoiceComparison,
  VoiceCoreMetrics,
  VoiceMonotonyComparison,
  VoiceMonotonyLevel,
  VoicePitchComparison,
  VoicePitchProfile,
  VoiceTremorComparison,
  VoiceTremorLevel,
} from '@/lib/biometrics/types/voice-core-metrics.types';
import type {
  VoiceStressLevel,
  VoiceVsiComparison,
} from '@/lib/biometrics/types/voice-stress-index.types';

export function labelVsiLevel(level: VoiceStressLevel): string {
  if (level === 'elevated') {
    return 'Повышенная нагрузка';
  }
  if (level === 'moderate') {
    return 'Умеренная нагрузка';
  }
  return 'Низкая нагрузка';
}

export function labelVsiComparison(c: VoiceVsiComparison): string {
  const map: Record<VoiceVsiComparison, string> = {
    above_usual: 'Выше вашего обычного',
    below_usual: 'Ниже вашего обычного',
    elevated_in_recording: 'В записи — повышенная нагрузка',
    low_in_recording: 'В записи — низкая нагрузка',
    moderate_in_recording: 'В записи — умеренная нагрузка',
    typical: 'Как обычно у вас',
  };
  return map[c];
}

export function labelPitchProfile(profile: VoicePitchProfile): string {
  if (profile === 'low') {
    return 'Ниже по тону';
  }
  if (profile === 'high') {
    return 'Выше по тону';
  }
  return 'Средний тон';
}

export function labelTremorLevel(level: VoiceTremorLevel): string {
  if (level === 'elevated') {
    return 'Заметное дрожание';
  }
  if (level === 'moderate') {
    return 'Умеренное дрожание';
  }
  return 'Низкое дрожание';
}

export function labelMonotonyLevel(level: VoiceMonotonyLevel): string {
  if (level === 'flat') {
    return 'Ровная, монотонная речь';
  }
  if (level === 'balanced') {
    return 'Умеренная выразительность';
  }
  return 'Выразительная интонация';
}

export function labelTremorComparison(c: VoiceTremorComparison): string {
  const map: Record<VoiceTremorComparison, string> = {
    above_usual: 'Выше вашего обычного',
    below_usual: 'Ниже вашего обычного',
    elevated_in_recording: 'В записи заметны признаки дрожания',
    low_in_recording: 'В записи дрожание слабое',
    moderate_in_recording: 'В записи умеренные признаки дрожания',
    typical: 'Как обычно у вас',
  };
  return map[c];
}

export function labelMonotonyComparison(c: VoiceMonotonyComparison): string {
  const map: Record<VoiceMonotonyComparison, string> = {
    above_usual: 'Монотоннее обычного',
    below_usual: 'Выразительнее обычного',
    balanced_in_recording: 'Умеренная монотонность в записи',
    expressive_in_recording: 'В записи выразительная интонация',
    flat_in_recording: 'В записи ровная, монотонная речь',
    typical: 'Как обычно у вас',
  };
  return map[c];
}

export function labelPitchComparison(c: VoicePitchComparison): string {
  const map: Record<VoicePitchComparison, string> = {
    higher_than_usual: 'Выше вашего обычного',
    lower_than_usual: 'Ниже вашего обычного',
    profile_high: 'Тон выше в этом замере',
    profile_low: 'Тон ниже в этом замере',
    profile_mid: 'Средний тон в этом замере',
    unchanged: 'Как обычно у вас',
  };
  return map[c];
}

export function comparisonModeHint(comparison: VoiceComparison): string | null {
  if (comparison.mode === 'first_session_anchor') {
    return 'Первый замер — ориентир по этой записи. После нескольких качественных замеров сравнение станет с вашим обычным уровнем.';
  }
  const n = comparison.sessionsInBaseline;
  return `Сравнение с вашими прошлыми замерами (${String(n)} в базе).`;
}

export function formatCoreMetricSummary(
  core: VoiceCoreMetrics,
  comparison: VoiceComparison,
): { monotony: string; pitch: string; tremor: string } {
  return {
    monotony: `${labelMonotonyLevel(core.monotonyLevel)} · ${labelMonotonyComparison(comparison.monotony)}`,
    pitch: `${labelPitchProfile(core.pitchProfile)} · ${labelPitchComparison(comparison.pitch)}`,
    tremor: `${labelTremorLevel(core.tremorLevel)} · ${labelTremorComparison(comparison.tremor)}`,
  };
}
