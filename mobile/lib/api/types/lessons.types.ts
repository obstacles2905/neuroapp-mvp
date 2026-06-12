import type { LocalizedText } from './localized-text.types';

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
  title: LocalizedText;
  order: number;
  blocks: AppLessonBlock[];
};
