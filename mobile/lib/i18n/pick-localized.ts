import type { LocalizedText } from '@/lib/api/types/localized-text.types';

const LOCALES = ['ru', 'uk', 'en'] as const;

export function pickLocalized(text: LocalizedText): string {
  for (const loc of LOCALES) {
    const s = text[loc].trim();
    if (s.length > 0) {
      return text[loc];
    }
  }
  return '';
}

export type LocalizedStringArrays = {
  ru: string[];
  uk: string[];
  en: string[];
};

export function pickLocalizedSentences(
  arr: LocalizedStringArrays,
): string[] {
  for (const loc of LOCALES) {
    if (arr[loc].length > 0) {
      return arr[loc];
    }
  }
  return [];
}
