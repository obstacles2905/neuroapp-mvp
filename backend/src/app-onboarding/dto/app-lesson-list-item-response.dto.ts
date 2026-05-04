import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LocalizedText } from '../../common/types/localized-text.type';
import { AppLessonProgressSnapshotResponseDto } from './app-lesson-progress-snapshot-response.dto';

export class AppLessonListItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Локализованные строки (ru, uk, en)' })
  title: LocalizedText;

  @ApiProperty()
  order: number;

  @ApiPropertyOptional({ type: AppLessonProgressSnapshotResponseDto })
  progress: AppLessonProgressSnapshotResponseDto | null;
}
