import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class SubmitOnboardingDto {
  @ApiProperty({
    description:
      'От 1 до 5 симптомов MND в порядке важности: первый — самый значимый',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  orderedSymptomIds: string[];
}
