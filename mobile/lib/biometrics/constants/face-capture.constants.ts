export const FACE_PROTOCOL_VERSION = 'face-mvp-1';

export const FACE_EXTRACTOR_ID = 'mediapipe-face-landmarker' as const;

export const FACE_MODEL_FILENAME = 'face_landmarker.task';

export const FACE_PIPELINE_MODEL_ID = 'mediapipe-face-landmarker-lite';

export const FACE_PIPELINE_MODEL_VERSION = '0.10.0';

/** Сколько кадров burst с камеры на одну фазу. */
export const FACE_BURST_FRAME_COUNT = 1;

export const FACE_BURST_FRAME_DELAY_MS = 120;

export const FACE_PREFLIGHT_COUNTDOWN_SEC = 3;

export const FACE_CONSENT_STORAGE_KEY = 'face_biometry_consent_v1';

export const FACE_PROTOCOL_PHASE_ORDER = [
  'baseline',
  'guided_smile',
  'guided_frown',
  'guided_surprise',
] as const;

export const FACE_PHASE_INSTRUCTIONS: Record<
  (typeof FACE_PROTOCOL_PHASE_ORDER)[number],
  string
> = {
  baseline: 'Смотри в камеру спокойно, без выражения лица — 2–3 секунды.',
  guided_smile: 'Улыбнись естественно, как для фото.',
  guided_frown: 'Слегка нахмурь брови, без напряжения челюсти.',
  guided_surprise: 'Покажи удивление: приподними брови, слегка приоткрой рот.',
};
