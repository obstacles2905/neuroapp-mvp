import { ApiProperty } from '@nestjs/swagger';
import { LessonStepType } from '../../common/enums/lesson-step-type.enum';

/**
 * content: для video/animation добавлено поле mediaUrl; остальные типы — как в БД
 */
export class AppLessonStepResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ enum: LessonStepType })
  type: LessonStepType;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  content: Record<string, unknown>;
}
