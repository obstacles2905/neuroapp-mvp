import { ApiProperty } from '@nestjs/swagger';

export class AppMeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  displayName: string | null;

  @ApiProperty({
    nullable: true,
    description: 'ISO 8601, если онбординг завершён',
  })
  onboardingCompletedAt: string | null;

  @ApiProperty({
    nullable: true,
    description:
      'Пользователь нажал «Пропустить» (можно дойти до приоритетов с профиля)',
  })
  onboardingSkippedAt: string | null;

  @ApiProperty({
    nullable: true,
    description: 'ISO 8601 — первичный просмотр «Слово Архитектора» завершён',
  })
  architectWordSeenAt: string | null;

  @ApiProperty({
    description:
      'Нужно показать «Слово Архитектора» (онбординг завершён, просмотр ещё не был)',
  })
  needsArchitectWord: boolean;

  @ApiProperty({
    nullable: true,
    description: 'ISO 8601 — первичный просмотр «Приветствие» завершён',
  })
  sessionGreetingSeenAt: string | null;

  @ApiProperty({
    description:
      'Нужно показать «Приветствие» (онбординг завершён, экран ещё не пройден)',
  })
  needsSessionGreeting: boolean;

  @ApiProperty({
    nullable: true,
    description: 'ISO 8601 — первичный просмотр «Финальное слово» завершён',
  })
  sessionFinalWordSeenAt: string | null;

  @ApiProperty({
    description:
      'Нужно показать «Финальное слово» («Слово Архитектора» завершено, экран ещё не пройден)',
  })
  needsSessionFinalWord: boolean;

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

  @ApiProperty({
    nullable: true,
    description:
      'ISO 8601 — момент последнего завершённого упражнения, засчитанного в стрик',
  })
  activityStreakLastCompletedAt: string | null;
}
