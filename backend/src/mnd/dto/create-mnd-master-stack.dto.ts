import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { MndMasterStackCode } from '../../common/enums/mnd-master-stack-code.enum';
import { MndLocalizedTextDto } from './mnd-localized-text.dto';

export class CreateMndMasterStackDto {
  @ApiProperty({ enum: MndMasterStackCode })
  @IsEnum(MndMasterStackCode)
  code: MndMasterStackCode;

  @ApiProperty({ type: MndLocalizedTextDto })
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  title: MndLocalizedTextDto;

  @ApiProperty({ type: MndLocalizedTextDto })
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  description: MndLocalizedTextDto;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
