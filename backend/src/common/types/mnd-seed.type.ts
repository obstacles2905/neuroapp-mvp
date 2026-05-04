import type { MndExerciseDirection } from '../enums/mnd-exercise-direction.enum';
import type { MndMasterStackCode } from '../enums/mnd-master-stack-code.enum';

export interface MndMasterStackSeedRow {
  readonly id: string;
  readonly code: MndMasterStackCode;
  readonly titleRu: string;
  readonly descriptionRu: string;
  readonly order: number;
}

export interface MndSymptomSeedRow {
  readonly id: string;
  readonly code: string;
  readonly titleRu: string;
  readonly descriptionRu: string;
  readonly neurophysiologicalRootRu: string;
  readonly order: number;
}

export interface MndMatrixRuleSeedRow {
  readonly id: string;
  readonly symptomId: string;
  readonly targetActionRu: string;
  readonly bottomUpPercent: number;
  readonly topDownPercent: number;
  readonly stackCodes: readonly MndMasterStackCode[];
}

export interface MndExerciseSeedRow {
  readonly id: string;
  readonly masterStackId: string;
  readonly direction: MndExerciseDirection;
  readonly complexityLevel: number;
  readonly titleRu: string;
  readonly order: number;
}
