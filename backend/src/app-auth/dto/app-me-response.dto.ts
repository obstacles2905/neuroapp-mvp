import { ApiProperty } from '@nestjs/swagger';

export class AppMeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  displayName: string | null;

  @ApiProperty({ nullable: true, description: 'ISO 8601, если онбординг завершён' })
  onboardingCompletedAt: string | null;

  @ApiProperty({ nullable: true, description: 'Пользователь нажал «Пропустить» (можно дойти до приоритетов с профиля)' })
  onboardingSkippedAt: string | null;

  @ApiProperty({
    type: [String],
    description:
      'Id категорий по убыванию важности (legacy; после MND-онбординга обычно пусто)',
  })
  prioritizedCategoryIds: string[];

  @ApiProperty({
    type: [String],
    description:
      'Id симптомов MND по убыванию важности (только активные записи ранжирования)',
  })
  prioritizedSymptomIds: string[];

  @ApiProperty()
  needsOnboarding: boolean;

  @ApiProperty()
  activityStreakCount: number;

  @ApiProperty({ nullable: true, description: 'YYYY-MM-DD (UTC) последнего дня, учтённого в стрик' })
  activityStreakLastUtcDate: string | null;
}
