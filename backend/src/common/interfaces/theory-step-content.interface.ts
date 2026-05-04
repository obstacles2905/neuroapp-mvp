import type { LocalizedStringArrays } from '../types/localized-text.type';

export type TheoryDisplayMode = 'all' | 'step_by_step';

export interface TheoryStepContent {
  display_mode: TheoryDisplayMode;
  sentences: LocalizedStringArrays;
}
