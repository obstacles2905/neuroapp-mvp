import type { LessonStepContent } from '../interfaces/lesson-step-content.interface';

export type LessonStepContentParseSuccess = {
  success: true;
  content: LessonStepContent;
};

export type LessonStepContentParseFailure = {
  success: false;
  errorMessage: string;
};

export type LessonStepContentParseResult =
  | LessonStepContentParseSuccess
  | LessonStepContentParseFailure;
