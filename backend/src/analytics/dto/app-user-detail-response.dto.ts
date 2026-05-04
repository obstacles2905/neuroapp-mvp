import { ApiProperty } from '@nestjs/swagger';
import { LessonProgressAnalyticsRowDto } from './lesson-progress-analytics-row.dto';

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
}
