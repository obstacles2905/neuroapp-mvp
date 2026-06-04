import { ACTIVITY_STREAK_WINDOW_MS } from './activity-streak.constants';

export function msSinceLastCompletion(
  lastCompletedAt: Date | string | null,
  now: Date,
): number | null {
  if (lastCompletedAt == null) {
    return null;
  }
  return now.getTime() - new Date(lastCompletedAt).getTime();
}

export function isActivityStreakExpired(
  lastCompletedAt: Date | string | null,
  now: Date,
): boolean {
  const elapsed = msSinceLastCompletion(lastCompletedAt, now);
  if (elapsed == null) {
    return false;
  }
  return elapsed > ACTIVITY_STREAK_WINDOW_MS;
}

/**
 * Счётчик для ответа API: 0, если с последнего завершённого упражнения прошло > 24 ч.
 */
export function getEffectiveActivityStreakCount(
  storedCount: number,
  lastCompletedAt: Date | string | null,
  now: Date,
): number {
  if (storedCount <= 0 || lastCompletedAt == null) {
    return 0;
  }
  if (isActivityStreakExpired(lastCompletedAt, now)) {
    return 0;
  }
  return storedCount;
}

/**
 * Новый счётчик после завершения упражнения (урок или MND).
 * Сравниваем только с моментом предыдущего засчитанного завершения.
 */
export function nextActivityStreakCountAfterCompletion(
  storedCount: number,
  lastCompletedAt: Date | string | null,
  now: Date,
): number {
  const elapsed = msSinceLastCompletion(lastCompletedAt, now);
  if (elapsed == null || elapsed > ACTIVITY_STREAK_WINDOW_MS) {
    return 1;
  }
  const base =
    storedCount > 0 && !isActivityStreakExpired(lastCompletedAt, now)
      ? storedCount
      : 0;
  return base + 1;
}
