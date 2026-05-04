import { LessonContentBlockType } from '../enums/lesson-content-block-type.enum';
import { LessonStatus } from '../enums/lesson-status.enum';
import { LessonStepType } from '../enums/lesson-step-type.enum';
import { ONBOARDING_CATEGORY_SEED_IDS } from '../constants/onboarding-category-seed-ids.constant';
import type { I18nJsonField } from '../types/i18n-json.type';

export const DEMO_SEED_CATEGORIES = 10;
export const DEMO_SEED_LESSONS_PER_CATEGORY = 2;
export const DEMO_SEED_STEPS = 4;

/**
 * Стабильные UUID: не пересекающиеся диапазоны last-12-hex.
 */
function uLesson(lessonGlobal: number): string {
  return `b2000000-0000-4000-8000-${(0x2000 + lessonGlobal).toString(16).padStart(12, '0')}`;
}
function uBlock(lessonGlobal: number): string {
  return `b2000000-0000-4000-8000-${(0x1000 + lessonGlobal).toString(16).padStart(12, '0')}`;
}
function uStep(lessonGlobal: number, stepIndex: number): string {
  return `b2000000-0000-4000-8000-${(0xa00 + lessonGlobal * 4 + stepIndex).toString(16).padStart(12, '0')}`;
}

function titleRu(categoryIndex: number, lessonInCat: number): I18nJsonField {
  const t = `Тема ${String(categoryIndex + 1)} · урок ${String(lessonInCat + 1)}`;
  return { ru: t, uk: t, en: t };
}

export type DemoLessonStepSeed = {
  id: string;
  order: number;
  line1: string;
  line2: string;
};

export type DemoLessonSeed = {
  id: string;
  categoryIndex: number;
  order: number;
  title: I18nJsonField;
  blockId: string;
  steps: DemoLessonStepSeed[];
};

export { LessonContentBlockType, LessonStatus, LessonStepType };

/**
 * 10×2 урока, в каждом 4 слайда теории: 3 обучающих + 1 «урок пройден».
 */
export function buildDemoSeedLessons(): DemoLessonSeed[] {
  const out: DemoLessonSeed[] = [];
  for (let c = 0; c < DEMO_SEED_CATEGORIES; c += 1) {
    for (let l = 0; l < DEMO_SEED_LESSONS_PER_CATEGORY; l += 1) {
      const g = c * DEMO_SEED_LESSONS_PER_CATEGORY + l;
      const titleShort = `Тема ${String(c + 1)} · ${String(l + 1)}`;
      const steps: DemoLessonStepSeed[] = [
        {
          id: uStep(g, 0),
          order: 0,
          line1: `Слайд 1. Материал по теме ${String(c + 1)} (урок ${String(l + 1)}).`,
          line2: 'Переходите к следующему слайду, когда прочитаете.',
        },
        {
          id: uStep(g, 1),
          order: 1,
          line1: `Слайд 2. Краткое задание: запомните акцент этой подборки материалов.`,
          line2: 'Продолжайте, чтобы дойти до конца сценария.',
        },
        {
          id: uStep(g, 2),
          order: 2,
          line1: `Слайд 3. Завершаем основной блок: «${titleShort}».`,
          line2: 'Остался финальный экран с итогом.',
        },
        {
          id: uStep(g, 3),
          order: 3,
          line1: `Поздравляем! Урок «${titleShort}» пройден.`,
          line2:
            'Прогресс сохранён. Неуспешное завершение (выход до этого экрана) не засчитывается в стрик.',
        },
      ];
      out.push({
        id: uLesson(g),
        categoryIndex: c,
        order: l,
        title: titleRu(c, l),
        blockId: uBlock(g),
        steps,
      });
    }
  }
  return out;
}

export function getDemoCategoryIdForIndex(categoryIndex: number): string {
  return ONBOARDING_CATEGORY_SEED_IDS[categoryIndex];
}
