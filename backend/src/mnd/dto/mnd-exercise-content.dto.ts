import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { MndLocalizedTextDto } from './mnd-localized-text.dto';

export class MndExerciseContentDto {
  @ApiPropertyOptional({ type: MndLocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  purpose?: MndLocalizedTextDto;

  @ApiPropertyOptional({ type: MndLocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  instructions?: MndLocalizedTextDto;

  @ApiPropertyOptional({ type: MndLocalizedTextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  successMarkers?: MndLocalizedTextDto;
}
