import { ApiProperty } from '@nestjs/swagger';

export class ArchitectWordAdminSlotResponseDto {
  @ApiProperty({ minimum: 1, maximum: 2 })
  slot: number;

  @ApiProperty({ nullable: true })
  id: string | null;

  @ApiProperty({ nullable: true })
  s3Key: string | null;

  @ApiProperty({ nullable: true })
  mediaUrl: string | null;

  @ApiProperty()
  isPublished: boolean;
}
