import { ApiProperty } from '@nestjs/swagger';

export class SessionBriefingPresentationSlideDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mediaUrl: string;
}

export class SessionBriefingPresentationResponseDto {
  @ApiProperty({ type: SessionBriefingPresentationSlideDto, nullable: true })
  slide: SessionBriefingPresentationSlideDto | null;
}
