import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  VoiceAcousticSnapshotDto,
  VoiceComparisonDto,
  VoiceCoreMetricsDto,
} from './voice-core-metrics.dto';

export class VoiceProductMetricsDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  throatTensionScore: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  tremorScore: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  confidenceScore: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  monotonicityScore: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  emotionalActivationScore: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  vocalStabilityScore: number;
}

export class VoiceQualityResultDto {
  @ApiProperty({ enum: ['ok', 'retry_suggested', 'failed'] })
  @IsIn(['ok', 'retry_suggested', 'failed'])
  overall: 'ok' | 'retry_suggested' | 'failed';

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  confidencePercent?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  retryReasons?: string[];
}

export class VoiceInterpretationDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  bullets: string[];

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  disclaimerLine: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  headline: string;
}

export class SubmitVoiceMeasurementDto {
  @ApiProperty({ description: 'Идемпотентный UUID замера на клиенте' })
  @IsUUID('4')
  id: string;

  @ApiProperty()
  @IsISO8601()
  capturedAt: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  protocolVersion: string;

  @ApiProperty({ enum: ['opensmile'] })
  @IsIn(['opensmile'])
  extractorId: 'opensmile';

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  extractorVersion: string;

  @ApiProperty({ enum: ['eGeMAPSv02', 'ComParE_2016', 'custom'] })
  @IsIn(['eGeMAPSv02', 'ComParE_2016', 'custom'])
  featureSet: 'eGeMAPSv02' | 'ComParE_2016' | 'custom';

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  scoringVersion: string;

  @ApiProperty({ minimum: 1, maximum: 600_000 })
  @IsInt()
  @Min(1)
  @Max(600_000)
  durationMs: number;

  @ApiProperty({ type: VoiceQualityResultDto })
  @ValidateNested()
  @Type(() => VoiceQualityResultDto)
  quality: VoiceQualityResultDto;

  @ApiProperty({ type: VoiceProductMetricsDto })
  @ValidateNested()
  @Type(() => VoiceProductMetricsDto)
  metrics: VoiceProductMetricsDto;

  @ApiPropertyOptional({ type: VoiceInterpretationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VoiceInterpretationDto)
  interpretation?: VoiceInterpretationDto;

  @ApiPropertyOptional({ type: VoiceCoreMetricsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VoiceCoreMetricsDto)
  coreMetrics?: VoiceCoreMetricsDto;

  @ApiPropertyOptional({ type: VoiceComparisonDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VoiceComparisonDto)
  comparison?: VoiceComparisonDto;

  @ApiPropertyOptional({ type: VoiceAcousticSnapshotDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VoiceAcousticSnapshotDto)
  acousticSnapshot?: VoiceAcousticSnapshotDto;
}
