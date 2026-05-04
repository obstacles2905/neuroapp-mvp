import type { LocalizedText } from './localized-text.types';

export type AppSymptomListItem = {
  id: string;
  code: string;
  title: LocalizedText;
  description: LocalizedText;
  neurophysiologicalRoot: LocalizedText;
  order: number;
};

export type AppCategoryListItem = {
  id: string;
  title: LocalizedText;
  order: number;
  /** Сколько опубликовано уроков в категории (для UI: 0 — нет уроков) */
  publishedLessonsCount: number;
  /** 0–100: доля завершённых уроков; при отсутствии уроков с бэка приходит 0 */
  percentComplete: number;
};
