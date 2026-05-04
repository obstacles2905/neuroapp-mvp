import { ApiProperty } from '@nestjs/swagger';
import { UserLessonProgressStatus } from '../../common/enums/user-lesson-progress-status.enum';

export class LessonProgressAnalyticsRowDto {
  @ApiProperty()
  lessonId: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  lessonTitle: Record<string, string>;

  @ApiProperty({ enum: UserLessonProgressStatus })
  status: UserLessonProgressStatus;

  @ApiProperty()
  percentComplete: number;

  @ApiProperty({ nullable: true, type: String })
  lastActiveAt: string | null;
}
