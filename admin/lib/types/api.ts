export type LocalizedText = {
  ru: string;
  uk: string;
  en: string;
};

export type CategoryCatalogAudience = 'production' | 'experimental';

export type MndMasterStackCode = 'ST-1' | 'ST-2' | 'ST-3' | 'ST-4' | 'ST-5' | 'ST-6';

export type MndExerciseDirection = 'bottom_up' | 'top_down';

export type Category = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  isPublished: boolean;
  catalogAudience: CategoryCatalogAudience;
  catalogFeatureFlagKey: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

export type Lesson = {
  id: string;
  categoryId: string;
  title: LocalizedText;
  status: 'draft' | 'published';
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type { LessonStep, LessonStepType, LessonStepContent } from './lesson-step';

export type LessonContentBlockType =
  | 'what_exercise'
  | 'how_to_do'
  | 'why_do_it'
  | 'how_often'
  | 'what_it_gives';

export type LessonBlock = {
  id: string;
  lessonId: string;
  blockType: LessonContentBlockType;
  order: number;
  slides: import('./lesson-step').LessonStep[];
  createdAt: string;
  updatedAt: string;
};

export type LessonWithBlocks = Lesson & {
  blocks: LessonBlock[];
};

export type AppUserSummary = {
  id: string;
  email: string | null;
  displayName: string | null;
  lessonsCompleted: number;
  lessonsInProgress: number;
  lastActiveAt: string | null;
};

export type LessonProgressRow = {
  lessonId: string;
  lessonTitle: Record<string, string>;
  status: string;
  percentComplete: number;
  lastActiveAt: string | null;
};

export type AppUserDetail = {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  progress: LessonProgressRow[];
};

export type MndSymptom = {
  id: string;
  code: string;
  title: LocalizedText;
  description: LocalizedText;
  neurophysiologicalRoot: LocalizedText;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MndMasterStack = {
  id: string;
  code: MndMasterStackCode;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MndMatrixRuleStack = {
  id: string;
  ruleId: string;
  masterStackId: string;
  priority: number;
  masterStack?: MndMasterStack;
};

export type MndMatrixRule = {
  id: string;
  symptomId: string;
  symptom?: MndSymptom;
  targetAction: LocalizedText;
  bottomUpPercent: number;
  topDownPercent: number;
  stacks: MndMatrixRuleStack[];
  createdAt: string;
  updatedAt: string;
};

export type MndExerciseContent = {
  purpose?: LocalizedText;
  instructions?: LocalizedText;
  successMarkers?: LocalizedText;
};

export type MndExercise = {
  id: string;
  masterStackId: string;
  masterStack?: MndMasterStack;
  direction: MndExerciseDirection;
  complexityLevel: number;
  title: LocalizedText;
  content: MndExerciseContent | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  blocks?: MndExerciseBlock[];
};

export type MndExerciseBlock = {
  id: string;
  exerciseId: string;
  blockType: LessonContentBlockType;
  order: number;
  slides: import('./lesson-step').LessonStep[];
  createdAt: string;
  updatedAt: string;
};
