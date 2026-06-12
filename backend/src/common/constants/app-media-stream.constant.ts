import { ARCHITECT_WORD_MEDIA_FOLDER } from './architect-word.constants';

export const APP_MEDIA_STREAM_TTL_SECONDS = 60 * 60;

export const APP_MEDIA_ALLOWED_PREFIXES = [
  'videos/',
  'animations/',
  `${ARCHITECT_WORD_MEDIA_FOLDER}/`,
] as const;

export const APP_ENV_KEYS = {
  PUBLIC_API_URL: 'APP_PUBLIC_API_URL',
} as const;
