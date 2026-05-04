import type { OnboardingCategoryRankItem } from '../types/onboarding-category-rank.type';

export function buildPrioritizedCategoryIdsFromRanks(
  ranks: OnboardingCategoryRankItem[] | null | undefined,
): string[] {
  if (!ranks?.length) {
    return [];
  }
  return [...ranks]
    .sort((a, b) => a.rank - b.rank)
    .map((r) => r.categoryId);
}
