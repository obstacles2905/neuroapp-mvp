import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { UsageSegmentContext } from '../../common/enums/usage-segment-context.enum';
import { UsageSegmentKind } from '../../common/enums/usage-segment-kind.enum';

export class UsageSegmentItemDto {
  @ApiProperty({ description: 'UUID клиента для идемпотентности' })
  @IsString()
  @MaxLength(64)
  clientEventId: string;

  @ApiProperty({ enum: UsageSegmentKind })
  @IsEnum(UsageSegmentKind)
  kind: UsageSegmentKind;

  @ApiProperty({ enum: UsageSegmentContext })
  @IsEnum(UsageSegmentContext)
  context: UsageSegmentContext;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contextId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  startedAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  endedAt: string;
}
