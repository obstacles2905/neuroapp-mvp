/**
 * Сколько кадров снимаем подряд (burst) перед агрегацией в пайплайне.
 * На слабых устройствах каждый кадр = полный цикл затвора; 3 кадра быстрее и всё ещё хватает на «лучший» кадр.
 */
export const POSE_BURST_FRAME_COUNT = 3;

/** Пауза между кадрами burst, мс (после уже медленного takePictureAsync на старых телефонах). */
export const POSE_BURST_FRAME_DELAY_MS = 90;

/**
 * Секунды обратного отсчёта перед серией: время занять позу перед затвором.
 */
export const POSE_PREFLIGHT_COUNTDOWN_SEC = 3;

/** Файл модели в бандле (Expo plugin mediapipe кладёт в android assets / iOS resources). */
export const POSE_MODEL_FILENAME = 'pose_landmarker_lite.task';

/** Идентификатор пайплайна с MediaPipe Pose Landmarker lite. */
export const POSE_PIPELINE_MODEL_ID = 'mediapipe-pose-landmarker-lite';

/** Версия пайплайна (semver продукта, не весов модели). */
export const POSE_PIPELINE_MODEL_VERSION = '1.0.0';

export const POSE_LANDMARK_MIN_VISIBILITY = 0.35;
