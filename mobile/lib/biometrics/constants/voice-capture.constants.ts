/** Целевая частота для последующего WAV/openSMILE (контракт на будущее; expo пока может давать AAC). */
export const VOICE_TARGET_SAMPLE_RATE_HZ = 16_000;

export const VOICE_PROTOCOL_VERSION = 'voice-mvp-v1';

export const VOICE_EXTRACTOR_ID = 'opensmile' as const;

/** Версия нативной связки openSMILE 3.x (Android). Должна совпадать с клоном в third_party/opensmile. */
export const VOICE_EXTRACTOR_VERSION_ANDROID = 'opensmile-3.0.2-android';

/** Пока нет нативного экстрактора: только metering / stub-пайплайн. */
export const VOICE_EXTRACTOR_VERSION_STUB = 'metering-proxy-v1';

export const VOICE_FEATURE_SET_EGEMAPS = 'eGeMAPSv02' as const;

export const VOICE_FEATURE_SET_STUB = 'custom' as const;

export const VOICE_SCORING_VERSION = 'core-v2-vsi';

/** Фраза фиксированной спич-сессии (единый текст для сравнимости сессий). */
export const VOICE_FIXED_PHRASE_TEXT =
  'Сегодня я замечаю своё состояние и даю себе время прислушаться к себе.';

export const VOICE_VOWEL_MIN_DURATION_MS = 3000;

export const VOICE_VOWEL_MAX_DURATION_MS = 7000;

export const VOICE_PHRASE_MIN_DURATION_MS = 5000;

export const VOICE_PHRASE_MAX_DURATION_MS = 12_000;

/** Доля семплов тишины (ниже порога dB), после которой — предложение повтора. */
export const VOICE_SILENCE_RATIO_FAIL = 0.55;

/** Семплов подряд у верхней границы шкалы — перегруз. */
export const VOICE_CLIPPING_RUN_SAMPLES = 6;

/** Ниже этого metering (обычно dBFS-ориентированное значение expo-av) считаем тишиной. */
export const VOICE_SILENCE_METERING_THRESHOLD = -45;

/** Выше этого — возможное клиппование для MVP-эвристики. */
export const VOICE_CLIPPING_METERING_THRESHOLD = -1;
