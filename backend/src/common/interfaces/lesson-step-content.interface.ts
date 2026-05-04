import type { AnimationStepContent } from './animation-step-content.interface';
import type { BiometricsStepContent } from './biometrics-step-content.interface';
import type { PracticeStepContent } from './practice-step-content.interface';
import type { TheoryStepContent } from './theory-step-content.interface';
import type { VideoStepContent } from './video-step-content.interface';

export type LessonStepContent =
  | TheoryStepContent
  | AnimationStepContent
  | VideoStepContent
  | PracticeStepContent
  | BiometricsStepContent;
