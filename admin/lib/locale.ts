export type ContentLocale = 'ru' | 'uk' | 'en';

export const CONTENT_LOCALES: { id: ContentLocale; label: string }[] = [
  { id: 'ru', label: 'Русский' },
  { id: 'uk', label: 'Українська' },
  { id: 'en', label: 'English' },
];

export function parseContentLocale(raw: string | null | undefined): ContentLocale {
  if (raw === 'ru' || raw === 'uk' || raw === 'en') {
    return raw;
  }
  return 'ru';
}
