export type SupportedLocale = 'ru' | 'uk' | 'en';

export type LocalizedText = Record<SupportedLocale, string>;

export type LocalizedStringArrays = Record<SupportedLocale, string[]>;
