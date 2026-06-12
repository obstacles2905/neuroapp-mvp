import { PartialType } from '@nestjs/mapped-types';
import { CreateExerciseStepDto } from './create-exercise-step.dto';

export class UpdateExerciseStepDto extends PartialType(CreateExerciseStepDto) {}

/** @deprecated Use UpdateExerciseStepDto */
export { UpdateExerciseStepDto as UpdateLessonStepDto };
