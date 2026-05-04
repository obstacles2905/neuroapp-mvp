import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { MatchProperty } from '../../common/helpers/match-property.decorator.helper';

export class AppRegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Must match password' })
  @IsString()
  @MatchProperty('password', {
    message: 'passwordConfirm must match password',
  })
  passwordConfirm: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName: string;
}
