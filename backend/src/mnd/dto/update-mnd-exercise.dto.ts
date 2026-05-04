import { PartialType } from '@nestjs/mapped-types';
import { CreateMndExerciseDto } from './create-mnd-exercise.dto';

export class UpdateMndExerciseDto extends PartialType(CreateMndExerciseDto) {}
