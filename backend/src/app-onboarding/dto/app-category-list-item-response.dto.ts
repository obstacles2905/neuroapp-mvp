import { ApiProperty } from '@nestjs/swagger';
import type { LocalizedText } from '../../common/types/localized-text.type';

export class AppCategoryListItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Локализованные строки (ru, uk, en)' })
  title: LocalizedText;

  @ApiProperty()
  order: number;

  @ApiProperty({ description: 'Число опубликованных уроков в категории' })
  publishedLessonsCount: number;

  @ApiProperty({
    description:
      'Доля завершённых уроков (статус completed), 0–100. Если уроков нет — 0 (смотрите publishedLessonsCount).',
  })
  percentComplete: number;
}
