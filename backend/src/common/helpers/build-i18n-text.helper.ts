import type { LocalizedText } from '../types/localized-text.type';

export function buildI18nText(ru: string): LocalizedText {
  return { ru, uk: ru, en: ru };
}
