/** Ракурс съёмки в рамках одной медиа-сессии. */
export type PoseCaptureViewKind = 'frontal' | 'profile';

/** Итог качества сессии съёмки / инференса (продуктовый статус). */
export type PoseSessionQuality = 'ok' | 'retry_suggested' | 'failed';

/** Тон списка истории (оформление, не диагноз). */
export type PoseInterpretationTone = 'attention' | 'neutral' | 'positive';

/** Одна строка числового отчёта: фактическое значение, эталон (под конфигурацию BA), отклонение. */
export interface PoseNumericMetricRow {
  /** Ключ для правил продукта / аналитики. */
  code: string;
  /** value − ideal. */
  deviation: number;
  /** Эталонное значение (подгоняется после калибровки на вашей выборке). */
  ideal: number;
  /** Короткая подпись для пользователя/BA. */
  label: string;
  /** Одна из точек замера или производная величина. */
  unit?: string | undefined;
  /** Измерение / расчёт. */
  value: number;
  viewKind: PoseCaptureViewKind;
}

/** Человеко-читаемая интерпретация (формат до v2, для старых записей на устройстве). */
export interface PoseUserInterpretation {
  bullets: string[];
  disclaimerLine: string;
  headline: string;
  tone: PoseInterpretationTone;
}

/** Наблюдение: локальные URI сохранённых кадров burst. */
export interface PoseBurstObservation {
  capturedAt: string;
  frameUris: string[];
  viewKind: PoseCaptureViewKind;
}

/** Одна точка скелета (нормализованные координаты кадра). */
export interface PoseLandmarkPoint {
  presence?: number;
  visibility?: number;
  x: number;
  y: number;
  z: number;
}

/** Снимок опорных точек на том кадре burst, по которому посчитан отчёт (для наложения на фото). */
export interface PosePipelineVisualizationSnapshot {
  chosenFrameUri: string;
  /**
   * Высота нормализованного кадра в пикселях (EXIF Orientation уже запечён в пиксели).
   * Опционально: у старых записей с диска поля нет — overlay тогда фолбэкается на `Image.getSize`.
   */
  frameHeight?: number | undefined;
  /** Ширина нормализованного кадра в пикселях. */
  frameWidth?: number | undefined;
  landmarks: PoseLandmarkPoint[];
}

/** Метрики осанки в плоскости кадра (службы / отладка; анфас наполнен сильнее профиля). */
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

/** Итог по одному ракурсу (анфас или профиль). */
export interface PoseSingleViewPipelineResult {
  metrics: PoseProductMetrics;
  numericRows: PoseNumericMetricRow[];
  observation: PoseBurstObservation;
  quality: PoseSessionQuality;
  qualityNote?: string | undefined;
  /** Опорные точки на ключевом кадре; может отсутствовать у старых записей без визуализации. */
  visualization?: PosePipelineVisualizationSnapshot | undefined;
}

/** Полный результат замера позы из двух ракурсов за одну сессию. */
export interface PoseDualViewSessionResult {
  frontal: PoseSingleViewPipelineResult;
  modelId: string;
  modelVersion: string;
  profile: PoseSingleViewPipelineResult;
}

/** @deprecated одноракурсный формат до двух позиций; остаётся для чтения старых `session.json`. */
export interface PoseBurstSessionLegacyResult {
  metrics: PoseProductMetrics;
  modelId: string;
  modelVersion: string;
  observation: Omit<PoseBurstObservation, 'viewKind'> & { viewKind?: PoseCaptureViewKind | undefined };
  quality: PoseSessionQuality;
  qualityNote?: string | undefined;
}
