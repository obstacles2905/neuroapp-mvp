/** Минимум качественных сессий для сравнения с собой. */
export const VOICE_BASELINE_MIN_SESSIONS = 3;

/** Максимум сессий в rolling baseline. */
export const VOICE_BASELINE_MAX_SESSIONS = 12;

/** Относительное отклонение от медианы baseline → «выше/ниже обычного». */
export const VOICE_BASELINE_DELTA_RATIO = 0.15;

/** eGeMAPS: границы профиля высоты (полутоны от 27.5 Hz, amean). */
export const VOICE_PITCH_SEMITONE_LOW_MAX = 20;

export const VOICE_PITCH_SEMITONE_HIGH_MIN = 28;

export const VOICE_PITCH_SCORE_SEMITONE_MIN = 12;

export const VOICE_PITCH_SCORE_SEMITONE_MAX = 36;

/** Индекс дрожания: веса jitter / shimmer. */
export const VOICE_TREMOR_JITTER_WEIGHT = 2200;

export const VOICE_TREMOR_SHIMMER_WEIGHT = 8;

export const VOICE_TREMOR_HNR_PENALTY_WEIGHT = 12;

/** Пороги уровня дрожания (индекс 0–100). */
export const VOICE_TREMOR_LEVEL_MODERATE_MIN = 28;

export const VOICE_TREMOR_LEVEL_ELEVATED_MIN = 50;

/** Первый замер: «заметно» в записи без baseline. */
export const VOICE_TREMOR_ANCHOR_ELEVATED_MIN = 48;

export const VOICE_TREMOR_ANCHOR_MODERATE_MIN = 26;

/** Монотонность: веса F0 range и loudness std (phrase). */
export const VOICE_MONOTONY_F0_RANGE_WEIGHT = 7.5;

export const VOICE_MONOTONY_LOUDNESS_STD_WEIGHT = 32;

export const VOICE_MONOTONY_LEVEL_FLAT_MIN = 65;

export const VOICE_MONOTONY_LEVEL_BALANCED_MIN = 35;

export const VOICE_MONOTONY_ANCHOR_FLAT_MIN = 62;

export const VOICE_MONOTONY_ANCHOR_BALANCED_MIN = 34;

/** Metering fallback. */
export const VOICE_METERING_TREMOR_CV_WEIGHT = 120;

export const VOICE_METERING_MONOTONY_CV_WEIGHT = 95;
