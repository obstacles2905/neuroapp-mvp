import { comparisonModeHint } from '@/lib/biometrics/helpers/voice-core-metrics-copy.helper';
import type {
  VoiceComparison,
  VoiceCoreMetrics,
} from '@/lib/biometrics/types/voice-core-metrics.types';
import type {
  VoiceSessionInterpretation,
  VoiceSessionQualityOverall,
} from '@/lib/biometrics/types/voice-measurement.types';

export function buildVoiceInterpretation(
  _core: VoiceCoreMetrics,
  comparison: VoiceComparison,
  overall: VoiceSessionQualityOverall,
  usedEgmaps: boolean,
): VoiceSessionInterpretation {
  const bullets: string[] = [];

  bullets.push(
    'Ниже — числовые шкалы по записи. Слева и справа — условные полюса, точка — ваш результат.',
  );

  if (usedEgmaps) {
    bullets.push('Признаки рассчитаны на устройстве (openSMILE, eGeMAPS).');
  }

  const modeHint = comparisonModeHint(comparison);
  if (modeHint != null) {
    bullets.push(modeHint);
  }

  if (overall !== 'ok') {
    bullets.push(
      'Качество записи может искажать цифры — повторите замер в тихом месте.',
    );
  }

  const headline = overall === 'ok' ? 'Результаты замера голоса' : 'Результаты замера (качество записи)';

  return {
    bullets,
    disclaimerLine:
      'Оценка по акустике одной записи, не медицинский вывод. После нескольких замеров сравнение с вашим обычным уровнем станет точнее.',
    headline,
  };
}
