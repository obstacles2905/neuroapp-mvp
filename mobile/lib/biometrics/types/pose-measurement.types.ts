/** Итог качества сессии съёмки / инференса (продуктовый статус). */
export type PoseSessionQuality = 'ok' | 'retry_suggested' | 'failed';

/** Наблюдение: локальные URI сохранённых кадров burst. */
export interface PoseBurstObservation {
  capturedAt: string;
  frameUris: string[];
}

/** Одна точка скелета (нормализованные координаты кадра). */
export interface PoseLandmarkPoint {
  presence?: number;
  visibility?: number;
  x: number;
  y: number;
  z: number;
}

/** Метрики осанки в плоскости кадра (интерпретация — осторожно при сильном ракурсе). */
export interface PoseProductMetrics {
  /** Угол «нос — мидпоинт плеч» относительно вертикали кадра, °; ~0 — голова над корпусом. */
  headTiltDeg: number | null;
  /** |Δy| между плечами × 100 (условные ед., 0–100+). */
  shoulderAsymmetryProxy: number | null;
  /** Угол линии между плечами относительно горизонтали, °; ~0 — плечи «ровно» в кадре. */
  shoulderLineTiltDeg: number | null;
  /** Среднее время инференса по кадрам серии, мс (если есть). */
  avgInferenceMs: number | null;
  /** min(visibility) опорных точек выбранного кадра, 0–1. */
  frameQualityScore: number | null;
}

/** Результат одной сессии замера позы (съёмка + пайплайн). */
export interface PoseBurstSessionResult {
  metrics: PoseProductMetrics;
  modelId: string;
  modelVersion: string;
  observation: PoseBurstObservation;
  quality: PoseSessionQuality;
  qualityNote?: string;
}
