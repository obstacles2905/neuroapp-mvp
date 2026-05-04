import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MndLocalizedTextDto {
  @ApiProperty()
  @IsString()
  ru: string;

  @ApiProperty()
  @IsString()
  uk: string;

  @ApiProperty()
  @IsString()
  en: string;
}
