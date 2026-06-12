import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ReorderStepItemDto } from './reorder-step-item.dto';

export class ReorderExerciseStepsDto {
  @ApiProperty({ type: [ReorderStepItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderStepItemDto)
  items: ReorderStepItemDto[];
}

/** @deprecated Use ReorderExerciseStepsDto */
export { ReorderExerciseStepsDto as ReorderLessonStepsDto };
