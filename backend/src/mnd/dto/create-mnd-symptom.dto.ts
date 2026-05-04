import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MndLocalizedTextDto } from './mnd-localized-text.dto';

export class CreateMndSymptomDto {
  @ApiProperty({ example: 'MND-01' })
  @IsString()
  @MaxLength(32)
  code: string;

  @ApiProperty({ type: MndLocalizedTextDto })
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  title: MndLocalizedTextDto;

  @ApiProperty({ type: MndLocalizedTextDto })
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  description: MndLocalizedTextDto;

  @ApiProperty({ type: MndLocalizedTextDto })
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  neurophysiologicalRoot: MndLocalizedTextDto;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
