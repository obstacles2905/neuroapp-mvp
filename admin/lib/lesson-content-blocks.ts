import type { LessonContentBlockType } from '@/lib/types/api';

export const LESSON_BLOCK_TITLES: Record<LessonContentBlockType, string> = {
  what_exercise: '1. Что за упражнение',
  how_to_do: '2. Как делать (видео, анимация, практика)',
  why_do_it: '3. Для чего делать',
  how_often: '4. Как часто',
  what_it_gives: '5. Что это в итоге даст',
};

export const LESSON_BLOCK_HINTS: Record<LessonContentBlockType, string> = {
  what_exercise:
    'Несколько слайдов: например краткое описание, короткая история — всё в рамках одного блока.',
  how_to_do: 'Слайды с видео, анимацией, практикой или замером — как выполнять упражнение.',
  why_do_it: 'Мотивация и смысл: зачем этот урок.',
  how_often: 'Текстовые слайды: рекомендации по частоте (не только число).',
  what_it_gives: 'Ожидаемый эффект и результат для пользователя.',
};
