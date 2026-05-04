export type LocalizedText = {
  ru: string;
  uk: string;
  en: string;
};

export type LessonStepType =
  | 'theory'
  | 'animation'
  | 'video'
  | 'practice'
  | 'biometrics';

export type LocalizedStringArrays = {
  ru: string[];
  uk: string[];
  en: string[];
};

export type TheoryStepContent = {
  display_mode: 'all' | 'step_by_step';
  sentences: LocalizedStringArrays;
};

export type AnimationStepContent = {
  s3_key: string;
  description: LocalizedText;
};

export type VideoStepContent = {
  s3_key: string;
  title: LocalizedText;
};

export type PracticeStepContent = {
  duration_seconds: number;
  instruction: LocalizedText;
};

export type BiometricsStepContent = {
  phase: 'before' | 'after';
  metric: 'heart_rate';
};

export type LessonStepContent =
  | TheoryStepContent
  | AnimationStepContent
  | VideoStepContent
  | PracticeStepContent
  | BiometricsStepContent;

export type LessonStep = {
  id: string;
  lessonBlockId?: string;
  exerciseBlockId?: string;
  order: number;
  type: LessonStepType;
  content: LessonStepContent;
  createdAt: string;
  updatedAt: string;
};

export const LESSON_STEP_TYPES: readonly LessonStepType[] = [
  'theory',
  'animation',
  'video',
  'practice',
  'biometrics',
] as const;

export const LESSON_STEP_LABELS: Record<LessonStepType, string> = {
  theory: 'Теория',
  animation: 'Анимация',
  video: 'Видео',
  practice: 'Практика',
  biometrics: 'Биометрия',
};

export function defaultContentForType(type: LessonStepType): LessonStepContent {
  const emptyText: LocalizedText = { ru: '', uk: '', en: '' };
  switch (type) {
    case 'theory':
      return {
        display_mode: 'all',
        sentences: { ru: [], uk: [], en: [] },
      };
    case 'animation':
      return { s3_key: '', description: { ...emptyText } };
    case 'video':
      return { s3_key: '', title: { ...emptyText } };
    case 'practice':
      return {
        duration_seconds: 60,
        instruction: { ...emptyText },
      };
    case 'biometrics':
      return { phase: 'before', metric: 'heart_rate' };
  }
}
