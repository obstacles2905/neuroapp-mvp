import { ApiProperty } from '@nestjs/swagger';

export class ActivityCalendarResponseDto {
  @ApiProperty({
    description:
      'Даты (UTC, YYYY-MM-DD), в которые был завершён хотя бы один урок',
    type: [String],
  })
  activeDays: string[];

  @ApiProperty({
    description: 'Сколько разных дней в месяце с завершённым уроком',
  })
  daysPracticedInMonth: number;
}
