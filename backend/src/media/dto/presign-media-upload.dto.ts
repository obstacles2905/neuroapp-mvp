import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MEDIA_UPLOAD_FOLDERS } from '../../common/constants/media-upload-folders.constant';

export class PresignMediaUploadDto {
  @ApiProperty({ example: 'lesson-intro.mp4' })
  @IsString()
  @MaxLength(255)
  originalName: string;

  @ApiProperty({ example: 'video/mp4' })
  @IsString()
  @MaxLength(128)
  contentType: string;

  @ApiProperty({ example: 18_874_368 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSize: number;

  @ApiPropertyOptional({ enum: MEDIA_UPLOAD_FOLDERS, example: 'videos' })
  @IsOptional()
  @IsString()
  @IsIn(MEDIA_UPLOAD_FOLDERS)
  folder?: string;
}
