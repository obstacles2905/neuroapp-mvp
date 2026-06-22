import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertSessionBriefingDto {
  @ApiPropertyOptional({ description: 'S3 object key; omit to keep current' })
  @IsOptional()
  @IsString()
  s3Key?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
