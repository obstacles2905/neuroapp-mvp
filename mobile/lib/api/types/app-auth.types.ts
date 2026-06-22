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
  /** Порядок важности симптомов MND (первый id — высший приоритет) */
  prioritizedSymptomIds: string[];
  needsOnboarding: boolean;
  architectWordSeenAt: string | null;
  needsArchitectWord: boolean;
  sessionGreetingSeenAt: string | null;
  needsSessionGreeting: boolean;
  sessionFinalWordSeenAt: string | null;
  needsSessionFinalWord: boolean;
  /** Дни подряд (UTC) с хотя бы одним «днём активности» */
  activityStreakCount: number;
  /** YYYY-MM-DD (UTC) последнего засчитанного дня */
  /** ISO 8601 — последнее завершённое упражнение, засчитанное в стрик */
  activityStreakLastCompletedAt: string | null;
};

export type AppRegisterRequest = {
  email: string;
  password: string;
  passwordConfirm: string;
  displayName: string;
};
