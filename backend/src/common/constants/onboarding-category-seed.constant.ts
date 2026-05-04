/** Тег в `categories.tags` для идемпотентного сидера онбординга */
export const ONBOARDING_CATEGORY_SEED_TAG = 'onboarding_seed_v1';

/**
 * Порядок sort_order и тексты (RU) для сид-категорий; uk/en — заглушки-копии.
 */
export const ONBOARDING_CATEGORY_SEED_ROWS: readonly {
  readonly order: number;
  readonly titleRu: string;
}[] = [
  { order: 0, titleRu: 'Эмоциональное истощение' },
  { order: 1, titleRu: 'Невозможность расслабиться' },
  { order: 2, titleRu: 'Раздражительность' },
  { order: 3, titleRu: 'Внутренний шум' },
  { order: 4, titleRu: 'Боязнь выступлений' },
  { order: 5, titleRu: 'Боязнь общения' },
  { order: 6, titleRu: 'Категория 7' },
  { order: 7, titleRu: 'Категория 8' },
  { order: 8, titleRu: 'Категория 9' },
  { order: 9, titleRu: 'Категория 10' },
];
