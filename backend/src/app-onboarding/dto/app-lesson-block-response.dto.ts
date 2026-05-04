import { ApiProperty } from '@nestjs/swagger';
import { LessonContentBlockType } from '../../common/enums/lesson-content-block-type.enum';
import { AppLessonStepResponseDto } from './app-lesson-step-response.dto';

export class AppLessonBlockResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ enum: LessonContentBlockType })
  blockType: LessonContentBlockType;

  @ApiProperty({ type: [AppLessonStepResponseDto] })
  steps: AppLessonStepResponseDto[];
}
