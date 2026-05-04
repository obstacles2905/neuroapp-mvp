import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

const MAX_I18N_LENGTH = 20_000;

export class LocalizedTextDto {
  @ApiProperty()
  @IsString()
  @MaxLength(MAX_I18N_LENGTH)
  ru: string;

  @ApiProperty()
  @IsString()
  @MaxLength(MAX_I18N_LENGTH)
  uk: string;

  @ApiProperty()
  @IsString()
  @MaxLength(MAX_I18N_LENGTH)
  en: string;
}
