import { ApiProperty } from '@nestjs/swagger';

export class ArchitectWordPresentationSlideDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  symptomId: string;

  @ApiProperty()
  symptomTitle: string;

  @ApiProperty({ minimum: 1, maximum: 2 })
  slot: number;

  @ApiProperty()
  mediaUrl: string;
}

export class ArchitectWordPresentationBlockDto {
  @ApiProperty()
  symptomId: string;

  @ApiProperty()
  symptomTitle: string;

  @ApiProperty({ type: [ArchitectWordPresentationSlideDto] })
  slides: ArchitectWordPresentationSlideDto[];
}

export class ArchitectWordPresentationResponseDto {
  @ApiProperty({ type: [ArchitectWordPresentationBlockDto] })
  blocks: ArchitectWordPresentationBlockDto[];

  @ApiProperty({
    description: 'Плоский список слайдов в порядке показа (блоки → ролики внутри блока)',
    type: [ArchitectWordPresentationSlideDto],
  })
  slides: ArchitectWordPresentationSlideDto[];

  @ApiProperty()
  skip: boolean;
}
