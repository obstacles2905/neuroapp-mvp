import { buildPrioritizedSymptomIdsFromRanks } from './build-prioritized-symptom-ids-from-ranks.helper';

describe('buildPrioritizedSymptomIdsFromRanks', () => {
  it('sorts by rank and omits inactive', () => {
    expect.assertions(1);
    const second = 'b0000000-0000-4000-8000-000000000002';
    const first = 'a0000000-0000-4000-8000-000000000001';
    const inactiveId = 'c0000000-0000-4000-8000-000000000003';
    const result = buildPrioritizedSymptomIdsFromRanks([
      { symptomId: second, rank: 2, isActive: true },
      { symptomId: first, rank: 1, isActive: true },
      { symptomId: inactiveId, rank: 3, isActive: false },
    ]);
    expect(result).toEqual([first, second]);
  });

  it('returns empty for nullish input', () => {
    expect.assertions(2);
    expect(buildPrioritizedSymptomIdsFromRanks(null)).toEqual([]);
    expect(buildPrioritizedSymptomIdsFromRanks([])).toEqual([]);
  });
});
