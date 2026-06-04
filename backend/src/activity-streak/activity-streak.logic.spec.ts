import {
  getEffectiveActivityStreakCount,
  isActivityStreakExpired,
  nextActivityStreakCountAfterCompletion,
} from './activity-streak.logic';

describe('activity-streak.logic', () => {
  const t0 = new Date('2026-06-01T10:00:00.000Z');

  it('first completion yields 1', () => {
    expect(nextActivityStreakCountAfterCompletion(0, null, t0)).toBe(1);
  });

  it('completion within 24h increments', () => {
    const t1 = new Date('2026-06-02T09:00:00.000Z');
    expect(nextActivityStreakCountAfterCompletion(1, t0, t1)).toBe(2);
  });

  it('completion after 24h restarts at 1', () => {
    const tLate = new Date('2026-06-03T10:01:00.000Z');
    expect(nextActivityStreakCountAfterCompletion(2, t0, tLate)).toBe(1);
  });

  it('effective count is 0 when window expired', () => {
    const now = new Date('2026-06-03T11:00:00.000Z');
    expect(getEffectiveActivityStreakCount(2, t0, now)).toBe(0);
    expect(isActivityStreakExpired(t0, now)).toBe(true);
  });

  it('effective count unchanged inside window', () => {
    const now = new Date('2026-06-01T20:00:00.000Z');
    expect(getEffectiveActivityStreakCount(2, t0, now)).toBe(2);
  });
});
