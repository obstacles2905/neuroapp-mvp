import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LocalizedText } from '../../common/types/localized-text.type';
import { AppLessonBlockResponseDto } from './app-lesson-block-response.dto';
import { AppLessonProgressSnapshotResponseDto } from './app-lesson-progress-snapshot-response.dto';

export class AppLessonDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty({ description: 'Локализованные строки (ru, uk, en)' })
  title: LocalizedText;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: [AppLessonBlockResponseDto] })
  blocks: AppLessonBlockResponseDto[];

  @ApiPropertyOptional({ type: AppLessonProgressSnapshotResponseDto })
  progress: AppLessonProgressSnapshotResponseDto | null;
}
