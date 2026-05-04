import type { LessonContentBlockType } from '@/lib/api/types/lessons.types';

/** Заголовки секций урока — совпадают с блоками в конструкторе контента. */
export const LESSON_BLOCK_SECTION_TITLES: Record<LessonContentBlockType, string> = {
  what_exercise: '1. Что за упражнение',
  how_to_do: '2. Как делать',
  why_do_it: '3. Для чего делать',
  how_often: '4. Как часто',
  what_it_gives: '5. Что это упражнение в итоге даст',
};
