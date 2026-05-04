import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsObject, IsOptional, Min } from 'class-validator';
import { LessonStepType } from '../../common/enums/lesson-step-type.enum';

export class CreateLessonStepDto {
  @ApiProperty({ enum: LessonStepType })
  @IsEnum(LessonStepType)
  type: LessonStepType;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  content: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
