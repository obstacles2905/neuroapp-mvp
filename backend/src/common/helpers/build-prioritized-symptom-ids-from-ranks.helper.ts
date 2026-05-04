import type { OnboardingSymptomRankItem } from '../types/onboarding-symptom-rank.type';

export function buildPrioritizedSymptomIdsFromRanks(
  ranks: OnboardingSymptomRankItem[] | null | undefined,
): string[] {
  if (!ranks?.length) {
    return [];
  }
  return [...ranks]
    .filter((r) => r.isActive !== false)
    .sort((a, b) => a.rank - b.rank)
    .map((r) => r.symptomId);
}
