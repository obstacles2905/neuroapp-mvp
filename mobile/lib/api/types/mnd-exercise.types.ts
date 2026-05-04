import type { LocalizedText } from './localized-text.types';
import type { AppLessonBlock } from './lessons.types';

export type AppMndExerciseDetail = {
  id: string;
  title: LocalizedText;
  order: number;
  direction: 'bottom_up' | 'top_down';
  masterStackCode: string;
  blocks: AppLessonBlock[];
};
