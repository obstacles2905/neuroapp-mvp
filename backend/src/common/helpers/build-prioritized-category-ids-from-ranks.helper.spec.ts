import { buildPrioritizedCategoryIdsFromRanks } from './build-prioritized-category-ids-from-ranks.helper';

describe('buildPrioritizedCategoryIdsFromRanks', () => {
  it('returns empty for null/empty', () => {
    expect.assertions(2);
    expect(buildPrioritizedCategoryIdsFromRanks(null)).toEqual([]);
    expect(buildPrioritizedCategoryIdsFromRanks([])).toEqual([]);
  });

  it('sorts by rank ascending', () => {
    expect.assertions(1);
    const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const c = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const result = buildPrioritizedCategoryIdsFromRanks([
      { categoryId: b, rank: 2 },
      { categoryId: a, rank: 1 },
      { categoryId: c, rank: 3 },
    ]);
    expect(result).toEqual([a, b, c]);
  });
});
