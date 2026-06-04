import {
  capSegmentDurationMs,
  isNewAppSession,
  isValidIanaTimeZone,
  localDayKeyFromInstant,
} from './usage-tracking.logic';
import { USAGE_MAX_SEGMENT_MS, USAGE_SESSION_GAP_MS } from './usage-tracking.constants';

describe('usage-tracking.logic', () => {
  it('validates IANA timezone', () => {
    expect(isValidIanaTimeZone('Europe/Moscow')).toBe(true);
    expect(isValidIanaTimeZone('Invalid/Zone')).toBe(false);
  });

  it('formats local day in user timezone', () => {
    const instant = new Date('2026-06-04T22:30:00.000Z');
    expect(localDayKeyFromInstant(instant, 'UTC')).toBe('2026-06-04');
    expect(localDayKeyFromInstant(instant, 'Europe/Moscow')).toBe('2026-06-05');
  });

  it('caps segment duration', () => {
    const start = new Date(0);
    const end = new Date(USAGE_MAX_SEGMENT_MS + 60_000);
    expect(capSegmentDurationMs(start, end)).toBe(USAGE_MAX_SEGMENT_MS);
  });

  it('detects new app session by gap', () => {
    const prevEnd = new Date(0);
    const started = new Date(prevEnd.getTime() + USAGE_SESSION_GAP_MS + 1);
    expect(isNewAppSession(prevEnd, started)).toBe(true);
    expect(isNewAppSession(prevEnd, new Date(1000))).toBe(false);
    expect(isNewAppSession(null, started)).toBe(true);
  });
});
