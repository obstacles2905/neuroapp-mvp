import { SessionBriefingPhase } from '../enums/session-briefing-phase.enum';

/** Один видеослот на фазу */
export const SESSION_BRIEFING_SLOT = 1 as const;

/** Префиксы ключей в object storage */
export const SESSION_BRIEFING_MEDIA_FOLDER_BY_PHASE: Record<
  SessionBriefingPhase,
  string
> = {
  [SessionBriefingPhase.GREETING]: 'session-greeting',
  [SessionBriefingPhase.FINAL_WORD]: 'session-final-word',
};
