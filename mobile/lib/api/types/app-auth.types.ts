export type AuthTokensResponse = {
  accessToken: string;
  tokenType: string;
};

export type AppUserMe = {
  id: string;
  email: string;
  displayName: string | null;
  onboardingCompletedAt: string | null;
  onboardingSkippedAt: string | null;
  /** Порядок важности категорий (legacy; после MND-онбординга обычно пусто) */
  prioritizedCategoryIds: string[];
  /** Порядок важности симптомов MND (первый id — высший приоритет) */
  prioritizedSymptomIds: string[];
  needsOnboarding: boolean;
  /** Дни подряд (UTC) с хотя бы одним «днём активности» */
  activityStreakCount: number;
  /** YYYY-MM-DD (UTC) последнего засчитанного дня */
  activityStreakLastUtcDate: string | null;
};

export type AppRegisterRequest = {
  email: string;
  password: string;
  passwordConfirm: string;
  displayName: string;
};
