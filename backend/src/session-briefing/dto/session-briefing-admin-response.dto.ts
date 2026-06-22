import { ApiProperty } from '@nestjs/swagger';
import { SessionBriefingPhase } from '../../common/enums/session-briefing-phase.enum';

export class SessionBriefingAdminResponseDto {
  @ApiProperty({ enum: SessionBriefingPhase })
  phase: SessionBriefingPhase;

  @ApiProperty({ nullable: true })
  id: string | null;

  @ApiProperty({ nullable: true })
  s3Key: string | null;

  @ApiProperty({ nullable: true })
  mediaUrl: string | null;

  @ApiProperty()
  isPublished: boolean;
}
