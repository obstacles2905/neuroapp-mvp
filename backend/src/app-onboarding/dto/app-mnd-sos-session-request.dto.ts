import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AppMndSosSessionRequestDto {
  @ApiProperty({
    description:
      'Острый симптом сейчас — тот же идентификатор, что в списке онбординга',
  })
  @IsUUID('4')
  symptomId: string;
}
