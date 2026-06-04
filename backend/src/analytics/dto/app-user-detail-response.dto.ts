import { ApiProperty } from '@nestjs/swagger';
import { LessonProgressAnalyticsRowDto } from './lesson-progress-analytics-row.dto';
import { UsageDailyRowDto } from './usage-daily-row.dto';

export class AppUserDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ nullable: true })
  displayName: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: [LessonProgressAnalyticsRowDto] })
  progress: LessonProgressAnalyticsRowDto[];

  @ApiProperty({ nullable: true })
  usageTimezone: string | null;

  @ApiProperty()
  totalAppMinutes: number;

  @ApiProperty()
  totalExerciseMinutes: number;

  @ApiProperty({
    description: 'totalAppMinutes − totalExerciseMinutes (не меньше 0)',
  })
  totalPassiveMinutes: number;

  @ApiProperty({ nullable: true, type: String })
  lastSeenAt: string | null;

  @ApiProperty({ type: [UsageDailyRowDto] })
  usageByDay: UsageDailyRowDto[];
}
