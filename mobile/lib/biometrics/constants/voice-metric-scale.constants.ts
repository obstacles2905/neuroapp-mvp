/** Порядок и подписи шкал на экране результата (0 слева, 100 справа). */
export const VOICE_METRIC_SCALE_ROWS = [
  {
    id: 'confidence',
    leftLabel: 'Неуверенно',
    rightLabel: 'Уверенно',
    title: 'Уверенность голоса',
  },
  {
    id: 'stability',
    leftLabel: 'Нестабильно',
    rightLabel: 'Стабильно',
    title: 'Стабильность',
  },
  {
    id: 'tremor',
    leftLabel: 'Ровный голос',
    rightLabel: 'Сильное дрожание',
    title: 'Дрожание',
  },
  {
    id: 'monotonicity',
    leftLabel: 'Выразительно',
    rightLabel: 'Монотонно',
    title: 'Монотонность',
  },
  {
    id: 'tension',
    leftLabel: 'Спокойный тон',
    rightLabel: 'Напряжённый тон',
    title: 'Напряжённость голоса',
  },
] as const;

export type VoiceMetricScaleId = (typeof VOICE_METRIC_SCALE_ROWS)[number]['id'];
