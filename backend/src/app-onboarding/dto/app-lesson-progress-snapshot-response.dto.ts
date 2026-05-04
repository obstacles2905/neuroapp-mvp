import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserLessonProgressStatus } from '../../common/enums/user-lesson-progress-status.enum';

export class AppLessonProgressSnapshotResponseDto {
  @ApiProperty({ enum: UserLessonProgressStatus })
  status: UserLessonProgressStatus;

  @ApiProperty()
  percentComplete: number;

  @ApiPropertyOptional()
  lastViewedStepId: string | null;

  @ApiPropertyOptional()
  lastActiveAt: string | null;

  @ApiPropertyOptional({
    description: 'Первое успешное завершение урока (ISO 8601)',
  })
  lessonCompletedAt: string | null;
}
