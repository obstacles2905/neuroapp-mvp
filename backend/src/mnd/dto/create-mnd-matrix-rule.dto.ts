import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MndLocalizedTextDto } from './mnd-localized-text.dto';
import { MndMatrixRuleStackDto } from './mnd-matrix-rule-stack.dto';

export class CreateMndMatrixRuleDto {
  @ApiProperty()
  @IsUUID()
  symptomId: string;

  @ApiProperty({ type: MndLocalizedTextDto })
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  targetAction: MndLocalizedTextDto;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  bottomUpPercent: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  topDownPercent: number;

  @ApiProperty({ type: [MndMatrixRuleStackDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MndMatrixRuleStackDto)
  stacks: MndMatrixRuleStackDto[];
}
