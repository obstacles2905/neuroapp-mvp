import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class VoiceCoreMetricsDto {
  @ApiProperty({ enum: ['low', 'mid', 'high'] })
  @IsIn(['low', 'mid', 'high'])
  pitchProfile: 'low' | 'mid' | 'high';

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  pitchScore: number;

  @ApiProperty({ enum: ['low', 'moderate', 'elevated'] })
  @IsIn(['low', 'moderate', 'elevated'])
  tremorLevel: 'low' | 'moderate' | 'elevated';

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  tremorIndex: number;

  @ApiProperty({ enum: ['expressive', 'balanced', 'flat'] })
  @IsIn(['expressive', 'balanced', 'flat'])
  monotonyLevel: 'expressive' | 'balanced' | 'flat';

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  monotonyIndex: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  shimmerScore: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  voiceStressIndex: number;

  @ApiProperty({ enum: ['low', 'moderate', 'elevated'] })
  @IsIn(['low', 'moderate', 'elevated'])
  voiceStressLevel: 'low' | 'moderate' | 'elevated';
}

export class VoiceAcousticSnapshotDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  f0SemitoneMean?: number;

  @ApiProperty()
  @IsNumber()
  f0SemitoneRange: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hnrDb?: number;

  @ApiProperty()
  @IsNumber()
  jitter: number;

  @ApiProperty()
  @IsNumber()
  shimmer: number;

  @ApiProperty()
  @IsNumber()
  loudnessStddevNorm: number;

  @ApiProperty({ enum: ['egemaps', 'metering_proxy'] })
  @IsIn(['egemaps', 'metering_proxy'])
  source: 'egemaps' | 'metering_proxy';
}

export class VoiceComparisonDto {
  @ApiProperty({ enum: ['first_session_anchor', 'personal_baseline'] })
  @IsIn(['first_session_anchor', 'personal_baseline'])
  mode: 'first_session_anchor' | 'personal_baseline';

  @ApiProperty()
  @IsString()
  tremor: string;

  @ApiProperty()
  @IsString()
  monotony: string;

  @ApiProperty()
  @IsString()
  pitch: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  sessionsInBaseline: number;

  @ApiProperty()
  @IsString()
  vsi: string;
}
