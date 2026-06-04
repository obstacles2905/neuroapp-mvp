/** Максимальная длина одного сегмента с клиента */
export const USAGE_MAX_SEGMENT_MS = 2 * 60 * 60 * 1000;

/** Новый визит, если с прошлого app-сегмента прошло больше этого интервала */
export const USAGE_SESSION_GAP_MS = 30 * 60 * 1000;

export const USAGE_LOCAL_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
