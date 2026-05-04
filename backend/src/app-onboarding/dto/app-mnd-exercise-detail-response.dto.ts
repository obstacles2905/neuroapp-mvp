import { ApiProperty } from '@nestjs/swagger';
import { MndExerciseDirection } from '../../common/enums/mnd-exercise-direction.enum';
import type { LocalizedText } from '../../common/types/localized-text.type';
import { AppLessonBlockResponseDto } from './app-lesson-block-response.dto';

export class AppMndExerciseDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Локализованные строки (ru, uk, en)' })
  title: LocalizedText;

  @ApiProperty()
  order: number;

  @ApiProperty({ enum: MndExerciseDirection })
  direction: MndExerciseDirection;

  @ApiProperty({ description: 'Код мастер-стека (ST-1 … ST-6)' })
  masterStackCode: string;

  @ApiProperty({ type: [AppLessonBlockResponseDto] })
  blocks: AppLessonBlockResponseDto[];
}
