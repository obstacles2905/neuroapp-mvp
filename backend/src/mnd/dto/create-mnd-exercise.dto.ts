import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MndExerciseDirection } from '../../common/enums/mnd-exercise-direction.enum';
import { MndExerciseContentDto } from './mnd-exercise-content.dto';
import { MndLocalizedTextDto } from './mnd-localized-text.dto';

export class CreateMndExerciseDto {
  @ApiProperty()
  @IsUUID()
  masterStackId: string;

  @ApiProperty({ enum: MndExerciseDirection })
  @IsEnum(MndExerciseDirection)
  direction: MndExerciseDirection;

  @ApiProperty({ minimum: 1, maximum: 15 })
  @IsInt()
  @Min(1)
  @Max(15)
  complexityLevel: number;

  @ApiProperty({ type: MndLocalizedTextDto })
  @ValidateNested()
  @Type(() => MndLocalizedTextDto)
  title: MndLocalizedTextDto;

  @ApiPropertyOptional({ type: MndExerciseContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MndExerciseContentDto)
  content?: MndExerciseContentDto | null;

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
