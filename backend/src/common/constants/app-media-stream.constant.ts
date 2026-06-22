import { ARCHITECT_WORD_MEDIA_FOLDER } from './architect-word.constants';
import { SESSION_BRIEFING_MEDIA_FOLDER_BY_PHASE } from './session-briefing.constants';
import { SessionBriefingPhase } from '../enums/session-briefing-phase.enum';

export const APP_MEDIA_STREAM_TTL_SECONDS = 60 * 60;

export const APP_MEDIA_ALLOWED_PREFIXES = [
  'videos/',
  'animations/',
  `${ARCHITECT_WORD_MEDIA_FOLDER}/`,
  `${SESSION_BRIEFING_MEDIA_FOLDER_BY_PHASE[SessionBriefingPhase.GREETING]}/`,
  `${SESSION_BRIEFING_MEDIA_FOLDER_BY_PHASE[SessionBriefingPhase.FINAL_WORD]}/`,
] as const;

export const APP_ENV_KEYS = {
  PUBLIC_API_URL: 'APP_PUBLIC_API_URL',
} as const;
