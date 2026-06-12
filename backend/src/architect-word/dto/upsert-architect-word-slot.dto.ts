import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertArchitectWordSlotDto {
  @ApiPropertyOptional({ description: 'S3 object key; omit to keep current' })
  @IsOptional()
  @IsString()
  s3Key?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class ArchitectWordSlotParamDto {
  @ApiProperty({ minimum: 1, maximum: 2 })
  @IsInt()
  @Min(1)
  @Max(2)
  slot: number;
}
