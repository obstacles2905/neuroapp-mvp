import { localDayKeyFromInstant } from '../usage-tracking/usage-tracking.logic';

export function msStringToNumber(value: string | number | null | undefined): number {
  if (value == null) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function msToRoundedMinutes(ms: number): number {
  return Math.round(ms / 60_000);
}

export function localDayDaysAgo(timeZone: string, days: number): string {
  const anchor = new Date(Date.now() - days * 86_400_000);
  return localDayKeyFromInstant(anchor, timeZone);
}

export function resolveUsageTimeZone(
  stored: string | null | undefined,
): string {
  if (stored != null && stored.length > 0) {
    return stored;
  }
  return 'UTC';
}
