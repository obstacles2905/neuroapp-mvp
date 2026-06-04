import { ApiProperty } from '@nestjs/swagger';

export class AppUserSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ nullable: true })
  displayName: string | null;

  @ApiProperty()
  lessonsCompleted: number;

  @ApiProperty()
  lessonsInProgress: number;

  @ApiProperty({ nullable: true, type: String })
  lastActiveAt: string | null;

  @ApiProperty({
    description: 'Суммарные минуты в приложении (foreground)',
  })
  totalAppMinutes: number;

  @ApiProperty({
    description: 'Суммарные минуты на уроках и MND-упражнениях',
  })
  totalExerciseMinutes: number;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Последний отправленный сегмент активности',
  })
  lastSeenAt: string | null;

  @ApiProperty({
    description: 'Число визитов (app-сессий) за последние 7 локальных дней',
  })
  sessionsLast7d: number;
}
