import type { LocalizedText } from './localized-text.types';

export const UserLessonProgressStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type UserLessonProgressStatusType =
  (typeof UserLessonProgressStatus)[keyof typeof UserLessonProgressStatus];

export type AppLessonProgressSnapshot = {
  status: UserLessonProgressStatusType;
  percentComplete: number;
  lastViewedStepId: string | null;
  lastActiveAt: string | null;
  /** ISO, первое завершение урока */
  lessonCompletedAt: string | null;
};

export type AppLessonListItem = {
  id: string;
  title: LocalizedText;
  order: number;
  progress: AppLessonProgressSnapshot | null;
};

export type LessonContentBlockType =
  | 'what_exercise'
  | 'how_to_do'
  | 'why_do_it'
  | 'how_often'
  | 'what_it_gives';

export type AppLessonStepType =
  | 'theory'
  | 'animation'
  | 'video'
  | 'practice'
  | 'biometrics';

export type AppLessonStep = {
  id: string;
  order: number;
  type: AppLessonStepType;
  content: Record<string, unknown>;
};

export type AppLessonBlock = {
  id: string;
  order: number;
  blockType: LessonContentBlockType;
  steps: AppLessonStep[];
};

export type AppLessonDetail = {
  id: string;
  categoryId: string;
  title: LocalizedText;
  order: number;
  blocks: AppLessonBlock[];
  progress: AppLessonProgressSnapshot | null;
};

export type UpdateLessonProgressBody = {
  percentComplete: number;
  status: UserLessonProgressStatusType;
  lastViewedStepId?: string;
};
