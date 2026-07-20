/** Версия rule-based формул поверх blendshapes. Меняй при калибровке порогов. */
export const FACE_SCORING_VERSION = 'face-rules-0.3.0';

/** Минимальная доля кадров с найденным лицом, чтобы сессия считалась валидной. */
export const FACE_MIN_DETECTED_RATIO = 0.75;

/** Порог expressiveness ниже которого предлагаем retry (гипомимия). */
export const FACE_LOW_EXPRESSIVENESS_THRESHOLD = 18;

/**
 * Границы зон UI (score 0..100).
 * Выразительность: выше = живее.
 * Напряжение и асимметрия: выше = больше сигнала внимания.
 */
export const FACE_BAND_LOW_MAX = 28;
export const FACE_BAND_MID_MAX = 55;

/**
 * Ключевые blendshapes целевой эмоции по фазам.
 * Подобраны по docs/biometry-face-emotion-test-photos (positive vs negative).
 * cheekSquint часто ≈0 у MediaPipe lite — в smile не включаем.
 * browInnerUp ближе к surprise, чем к frown — в frown не включаем.
 */
export const FACE_GUIDED_PHASE_SHAPES: Readonly<
  Record<'guided_smile' | 'guided_frown' | 'guided_surprise', readonly string[]>
> = {
  guided_smile: ['mouthSmileLeft', 'mouthSmileRight'],
  guided_frown: ['browDownLeft', 'browDownRight'],
  guided_surprise: [
    'browInnerUp',
    'eyeWideLeft',
    'eyeWideRight',
    'jawOpen',
  ],
};

/**
 * Пороги «явного противоречия» шагу (сырые blendshape 0..1).
 *
 * Философия: НЕ требуем яркой «правильной» эмоции (все люди разные, слабая
 * мимика — это норма и часть замера). Флагаем только когда на шаге отчётливо
 * сделана ПРОТИВОПОЛОЖНАЯ эмоция. Калибровка: blendshape-extract.json.
 */

/** baseline: спокойный шаг «сломан» только сильным выражением. */
export const FACE_BASELINE_CONTRADICTION_SMILE = 0.35;
export const FACE_BASELINE_CONTRADICTION_BROW_DOWN = 0.25;
export const FACE_BASELINE_CONTRADICTION_JAW_OPEN = 0.4;

/** smile: противоречие — отчётливо хмурое лицо вместо улыбки. */
export const FACE_SMILE_CONTRADICTION_BROW_DOWN = 0.15;
export const FACE_SMILE_CONTRADICTION_MARGIN = 0.1;

/** frown: противоречие — отчётливая улыбка вместо хмурых бровей. */
export const FACE_FROWN_CONTRADICTION_SMILE = 0.15;
export const FACE_FROWN_CONTRADICTION_MARGIN = 0.1;

/** surprise: противоречие — отчётливо опущенные брови (злость) вместо поднятых. */
export const FACE_SURPRISE_CONTRADICTION_BROW_DOWN = 0.15;

/** Напряжение челюсти/рта на baseline. */
export const FACE_TENSION_SHAPES = [
  'mouthPressLeft',
  'mouthPressRight',
  'mouthPucker',
  'mouthClose',
  'jawOpen',
] as const;

/** Парные коэффициенты для асимметрии. */
export const FACE_ASYMMETRY_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['mouthSmileLeft', 'mouthSmileRight'],
  ['browDownLeft', 'browDownRight'],
  ['eyeSquintLeft', 'eyeSquintRight'],
  ['eyeWideLeft', 'eyeWideRight'],
  ['cheekSquintLeft', 'cheekSquintRight'],
  ['mouthPressLeft', 'mouthPressRight'],
];
