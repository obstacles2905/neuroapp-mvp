import { ApiProperty } from '@nestjs/swagger';

export class UploadMediaResponseDto {
  @ApiProperty({ example: 'animations/1710000000000-uuid-file.mp4' })
  s3Key: string;

  @ApiProperty({
    example: 'http://localhost:9000/neuro-sync-media/animations/...',
  })
  url: string;
}
