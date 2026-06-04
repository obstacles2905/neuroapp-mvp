import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { UsageSegmentItemDto } from './usage-segment-item.dto';

export class SubmitUsageSegmentsDto {
  @ApiProperty({
    example: 'Europe/Moscow',
    description: 'IANA timezone устройства пользователя',
  })
  @IsString()
  @MaxLength(64)
  ianaTimeZone: string;

  @ApiProperty({ type: [UsageSegmentItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UsageSegmentItemDto)
  segments: UsageSegmentItemDto[];
}
