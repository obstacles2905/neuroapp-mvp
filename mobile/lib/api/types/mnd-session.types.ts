import type { LocalizedText } from './localized-text.types';

export type AppMndSessionStep = {
  id: string;
  title: LocalizedText;
  direction: 'bottom_up' | 'top_down';
  masterStackCode: string;
  complexityLevel: number;
  /**
   * Для «Сегодня»/SOS: true, если упражнение хотя бы раз отмечено выполненным.
   * Для джема: true только если оно отмечено в текущей джем-сессии за этот UTC-день
   * (завершение из вкладки «Джем» с флагом fromJam).
   */
  completed?: boolean;
};

export type AppDailyMndSession = {
  generatedAt: string;
  dayKeyUtc: string;
  avgBottomUpPercent: number;
  eligibleMasterStackIds: string[];
  symptomIdsUsed: string[];
  steps: AppMndSessionStep[];
};
