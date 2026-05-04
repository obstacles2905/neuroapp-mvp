import { ApiProperty } from '@nestjs/swagger';
import { MndExerciseDirection } from '../../common/enums/mnd-exercise-direction.enum';
import type { LocalizedText } from '../../common/types/localized-text.type';

export class AppDailyMndSessionStepDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: LocalizedText;

  @ApiProperty({ enum: MndExerciseDirection })
  direction: MndExerciseDirection;

  @ApiProperty({ description: 'Код мастер-стека, например ST-1' })
  masterStackCode: string;

  @ApiProperty()
  complexityLevel: number;

  @ApiProperty({
    description:
      'Для «Сегодня» и SOS: пользователь хотя бы раз завершил упражнение. Для джем-сессии: завершил это упражнение из джема в текущий UTC-день (POST …/complete?fromJam=true).',
  })
  completed: boolean;
}

export class AppDailyMndSessionResponseDto {
  @ApiProperty({ description: 'ISO 8601 момент генерации' })
  generatedAt: string;

  @ApiProperty({ description: 'Календарный день UTC (YYYY-MM-DD) для ротации' })
  dayKeyUtc: string;

  @ApiProperty({ description: 'Средний % Bottom-Up по выбранным симптомам' })
  avgBottomUpPercent: number;

  @ApiProperty({ type: [String] })
  eligibleMasterStackIds: string[];

  @ApiProperty({ type: [String] })
  symptomIdsUsed: string[];

  @ApiProperty({ type: [AppDailyMndSessionStepDto] })
  steps: AppDailyMndSessionStepDto[];
}
