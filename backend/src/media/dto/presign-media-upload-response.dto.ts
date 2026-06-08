import { ApiProperty } from '@nestjs/swagger';

export class PresignMediaUploadResponseDto {
  @ApiProperty({
    example:
      'http://localhost:9000/neuro-sync-media/videos/1710000000000-uuid-file.mp4?X-Amz-Algorithm=...',
  })
  uploadUrl: string;

  @ApiProperty({ example: 'videos/1710000000000-uuid-file.mp4' })
  s3Key: string;

  @ApiProperty({
    example: 'http://localhost:9000/neuro-sync-media/videos/1710000000000-uuid-file.mp4',
  })
  url: string;

  @ApiProperty({ example: 'PUT' })
  method: 'PUT';

  @ApiProperty({
    example: { 'Content-Type': 'video/mp4' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  headers: Record<string, string>;
}
