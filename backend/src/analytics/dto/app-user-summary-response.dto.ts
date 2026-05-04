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
}
