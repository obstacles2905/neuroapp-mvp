import { ApiProperty } from '@nestjs/swagger';
import type { LocalizedText } from '../../common/types/localized-text.type';

export class AppOnboardingSymptomListItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Стабильный код симптома (например MND-01)' })
  code: string;

  @ApiProperty({ description: 'Локализованные строки (ru, uk, en)' })
  title: LocalizedText;

  @ApiProperty({
    description: '«Суть» симптома — узнаваемое описание для пользователя',
  })
  description: LocalizedText;

  @ApiProperty({
    description: 'Нейрофизиологический корень (для справки / раскрытия)',
  })
  neurophysiologicalRoot: LocalizedText;

  @ApiProperty()
  order: number;
}
