import { normalizeCategoryTags } from './normalize-category-tags.helper';

describe('normalizeCategoryTags', () => {
  it('returns empty array for empty input', () => {
    expect.assertions(3);
    expect(normalizeCategoryTags(undefined)).toEqual([]);
    expect(normalizeCategoryTags(null)).toEqual([]);
    expect(normalizeCategoryTags([])).toEqual([]);
  });

  it('trims and dedupes case-insensitively', () => {
    expect.assertions(1);
    const tagSleep = 'Сон';
    const result = normalizeCategoryTags([
      `  ${tagSleep}  `,
      'сон',
      'Стресс',
    ]);
    expect(result).toEqual([tagSleep, 'Стресс']);
  });
});
