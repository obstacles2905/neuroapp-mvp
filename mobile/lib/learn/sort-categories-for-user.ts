import type { AppCategoryListItem } from '@/lib/api/types/onboarding.types';

/**
 * Сначала — категории в порядке приоритета с онбординга, затем остальные по order из API.
 */
export function sortCatalogForUser(
  categories: AppCategoryListItem[],
  prioritizedCategoryIds: string[],
): AppCategoryListItem[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const out: AppCategoryListItem[] = [];
  const used = new Set<string>();
  for (const id of prioritizedCategoryIds) {
    const c = byId.get(id);
    if (c) {
      out.push(c);
      used.add(c.id);
    }
  }
  const rest = categories
    .filter((c) => !used.has(c.id))
    .sort((a, b) => a.order - b.order);
  return [...out, ...rest];
}

export function buildPriorityRankMap(
  prioritizedCategoryIds: string[],
): Map<string, number> {
  const m = new Map<string, number>();
  prioritizedCategoryIds.forEach((id, i) => {
    m.set(id, i + 1);
  });
  return m;
}
