/** Веса VSI (сумма = 1), см. docs/open-smile.calculations.md */
export const VSI_WEIGHT_JITTER = 0.3;

export const VSI_WEIGHT_F0_RANGE = 0.25;

export const VSI_WEIGHT_SHIMMER = 0.2;

export const VSI_WEIGHT_F0_MEAN = 0.15;

export const VSI_WEIGHT_LOUDNESS_STD = 0.1;

/** Доля span от baseline для нормировки субиндекса 0–1 при персональном эталоне. */
export const VSI_BASELINE_SPREAD_RATIO = 0.45;

/** Минимальный абсолютный span (сырые eGeMAPS), чтобы не делить на ноль. */
export const VSI_MIN_RAW_SPREAD_JITTER = 0.008;

export const VSI_MIN_RAW_SPREAD_SHIMMER = 0.15;

export const VSI_MIN_RAW_SPREAD_F0_MEAN = 2;

export const VSI_MIN_RAW_SPREAD_F0_RANGE = 1.5;

export const VSI_MIN_RAW_SPREAD_LOUDNESS = 0.02;

/** Первый замер: якорные «стрессовые» потолки для сырых признаков (без baseline). */
export const VSI_ANCHOR_JITTER_MAX = 0.035;

export const VSI_ANCHOR_SHIMMER_MAX = 1.2;

export const VSI_ANCHOR_F0_MEAN_STRESS_SEMITONES = 32;

export const VSI_ANCHOR_F0_RANGE_MIN = 2;

export const VSI_ANCHOR_LOUDNESS_STD_MAX = 0.35;

/** Уровни VSI для UI. */
export const VSI_LEVEL_MODERATE_MIN = 35;

export const VSI_LEVEL_ELEVATED_MIN = 60;

/** Первый замер: пороги VSI «в записи». */
export const VSI_ANCHOR_ELEVATED_MIN = 58;

export const VSI_ANCHOR_MODERATE_MIN = 32;
