import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonStepDto } from './create-lesson-step.dto';

export class UpdateLessonStepDto extends PartialType(CreateLessonStepDto) {}
