import type { LocalizedText } from './localized-text.types';

export type AppSymptomListItem = {
  id: string;
  code: string;
  title: LocalizedText;
  description: LocalizedText;
  neurophysiologicalRoot: LocalizedText;
  order: number;
};
