import {
  USAGE_LOCAL_DAY_RE,
  USAGE_MAX_SEGMENT_MS,
  USAGE_SESSION_GAP_MS,
} from './usage-tracking.constants';

export function isValidIanaTimeZone(timeZone: string): boolean {
  if (timeZone.length === 0 || timeZone.length > 64) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function localDayKeyFromInstant(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export function capSegmentDurationMs(
  startedAt: Date,
  endedAt: Date,
): number {
  const raw = endedAt.getTime() - startedAt.getTime();
  if (raw <= 0) {
    return 0;
  }
  return Math.min(raw, USAGE_MAX_SEGMENT_MS);
}

export function isNewAppSession(
  previousEndedAt: Date | null,
  segmentStartedAt: Date,
): boolean {
  if (previousEndedAt == null) {
    return true;
  }
  return (
    segmentStartedAt.getTime() - previousEndedAt.getTime() >
    USAGE_SESSION_GAP_MS
  );
}

export function parseLocalDayRange(
  from: string,
  to: string,
): { from: string; to: string } | null {
  if (!USAGE_LOCAL_DAY_RE.test(from) || !USAGE_LOCAL_DAY_RE.test(to)) {
    return null;
  }
  if (from > to) {
    return null;
  }
  return { from, to };
}

export function addMsToBigintString(current: string, delta: number): string {
  const next = BigInt(current) + BigInt(delta);
  return next.toString();
}
