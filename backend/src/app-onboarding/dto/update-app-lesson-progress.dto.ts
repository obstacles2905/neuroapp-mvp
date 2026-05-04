import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { UserLessonProgressStatus } from '../../common/enums/user-lesson-progress-status.enum';

export class UpdateAppLessonProgressDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  @Max(100)
  percentComplete: number;

  @ApiProperty({ enum: UserLessonProgressStatus })
  @IsEnum(UserLessonProgressStatus)
  status: UserLessonProgressStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  lastViewedStepId?: string;
}
