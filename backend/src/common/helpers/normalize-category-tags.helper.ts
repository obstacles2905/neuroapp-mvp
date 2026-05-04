import {
  MAX_CATEGORY_TAG_LENGTH,
  MAX_CATEGORY_TAGS,
} from '../constants/category-tags.constants';

export function normalizeCategoryTags(
  input: string[] | undefined | null,
): string[] {
  if (!input?.length) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const t = raw.trim().slice(0, MAX_CATEGORY_TAG_LENGTH);
    if (t.length === 0) {
      continue;
    }
    const key = t.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(t);
    if (out.length >= MAX_CATEGORY_TAGS) {
      break;
    }
  }
  return out;
}
