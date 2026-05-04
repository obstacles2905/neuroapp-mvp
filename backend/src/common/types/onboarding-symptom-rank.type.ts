export type OnboardingSymptomRankItem = {
  symptomId: string;
  /** 1 — самый важный среди выбранных */
  rank: number;
  /**
   * Учитывать в персональном протоколе; выключение — без удаления из истории выбора.
   */
  isActive: boolean;
};
