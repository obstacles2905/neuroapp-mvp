/** Сколько кадров снимаем подряд (burst) перед агрегацией в пайплайне. */
export const POSE_BURST_FRAME_COUNT = 4;

/** Пауза между кадрами burst, мс. */
export const POSE_BURST_FRAME_DELAY_MS = 220;

/**
 * Секунды обратного отсчёта перед серией: время поставить телефон и встать в полный рост в кадре.
 */
export const POSE_PREFLIGHT_COUNTDOWN_SEC = 8;

/** Файл модели в бандле (Expo plugin mediapipe кладёт в android assets / iOS resources). */
export const POSE_MODEL_FILENAME = 'pose_landmarker_lite.task';

/** Идентификатор пайплайна с MediaPipe Pose Landmarker lite. */
export const POSE_PIPELINE_MODEL_ID = 'mediapipe-pose-landmarker-lite';

/** Версия пайплайна (semver продукта, не весов модели). */
export const POSE_PIPELINE_MODEL_VERSION = '1.0.0';

export const POSE_LANDMARK_MIN_VISIBILITY = 0.35;
