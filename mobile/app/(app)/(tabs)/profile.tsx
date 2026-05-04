import { StreakMonthCalendar } from '@/components/streak/StreakMonthCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import {
  fetchActivityCalendar,
  resetActivityStreak,
} from '@/lib/api/app-activity';
import { replayOnboarding } from '@/lib/api/app-onboarding';
import { useFocusEffect } from '@react-navigation/native';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

function ruDaysWord(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) {
    return 'дней';
  }
  if (m10 === 1) {
    return 'день';
  }
  if (m10 >= 2 && m10 <= 4) {
    return 'дня';
  }
  return 'дней';
}

function utcTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialUtcYearMonth(): { y: number; m: number } {
  const t = new Date();
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1 };
}

function shiftMonth(
  y: number,
  m: number,
  delta: -1 | 1,
): { y: number; m: number } {
  const t = new Date(Date.UTC(y, m - 1 + delta, 1));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1 };
}

export default function ProfileScreen(): React.JSX.Element {
  const { signOut, isLoggedIn, user, refreshUser } = useAuth();
  const router = useRouter();
  const [replayLoading, setReplayLoading] = useState(false);
  const [resetStreakLoading, setResetStreakLoading] = useState(false);
  const [streakError, setStreakError] = useState<string | null>(null);

  const [calYear, setCalYear] = useState(
    () => initialUtcYearMonth().y,
  );
  const [calMonth, setCalMonth] = useState(
    () => initialUtcYearMonth().m,
  );
  const [activeDays, setActiveDays] = useState<Set<string>>(() => new Set());
  const [daysPracticedInMonth, setDaysPracticedInMonth] = useState(0);
  const [calLoading, setCalLoading] = useState(true);
  const [calError, setCalError] = useState<string | null>(null);

  const theme = useAppTheme();
  const styles = useMemo(() => createProfileStyles(theme), [theme]);

  const todayKey = useMemo(() => utcTodayKey(), []);

  const loadCalendar = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!isLoggedIn || user == null) {
        setCalLoading(false);
        return;
      }
      const silent = options.silent === true;
      if (!silent) {
        setCalLoading(true);
      }
      setCalError(null);
      try {
        const data = await fetchActivityCalendar(calYear, calMonth);
        setActiveDays(new Set(data.activeDays));
        setDaysPracticedInMonth(data.daysPracticedInMonth);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Не удалось загрузить';
        setCalError(msg);
      } finally {
        if (!silent) {
          setCalLoading(false);
        }
      }
    },
    [calYear, calMonth, isLoggedIn, user],
  );

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn || user == null) {
        return;
      }
      void loadCalendar({ silent: true });
    }, [isLoggedIn, user, loadCalendar]),
  );

  const { y: pY, m: pM } = useMemo(
    () => shiftMonth(calYear, calMonth, -1),
    [calYear, calMonth],
  );
  const { y: nY, m: nM } = useMemo(
    () => shiftMonth(calYear, calMonth, 1),
    [calYear, calMonth],
  );

  const onCalPrev = useCallback((): void => {
    setCalYear(pY);
    setCalMonth(pM);
  }, [pY, pM]);

  const onCalNext = useCallback((): void => {
    setCalYear(nY);
    setCalMonth(nM);
  }, [nY, nM]);

  async function onSignOut(): Promise<void> {
    await signOut();
    router.replace('/(auth)/login');
  }

  async function onReplayOnboarding(): Promise<void> {
    setReplayLoading(true);
    try {
      await replayOnboarding();
      await refreshUser();
      router.replace('/(onboarding)' as Href);
    } finally {
      setReplayLoading(false);
    }
  }

  function onOpenOnboardingSettings(): void {
    router.push('/(onboarding)' as Href);
  }

  const showSetupPriorities =
    user != null &&
    user.onboardingCompletedAt == null &&
    !user.needsOnboarding;

  async function onResetStreak(): Promise<void> {
    setStreakError(null);
    setResetStreakLoading(true);
    try {
      await resetActivityStreak();
      await refreshUser();
      void loadCalendar({ silent: true });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось сбросить';
      setStreakError(msg);
    } finally {
      setResetStreakLoading(false);
    }
  }

  const streakCount = user?.activityStreakCount ?? 0;
  const streakDay = user?.activityStreakLastUtcDate;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={[styles.scroll, { backgroundColor: theme.background }]}
    >
      <Text style={styles.title}>Профиль</Text>
      {user ? (
        <View style={styles.userBlock}>
          {user.displayName ? (
            <Text style={styles.userName}>{user.displayName}</Text>
          ) : null}
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      ) : isLoggedIn ? (
        <Text style={styles.caption}>Сессия без данных профиля (dev).</Text>
      ) : null}
      {isLoggedIn && user ? (
        <View style={styles.streakCard}>
          <Text style={styles.streakTitle}>Стрик и календарь (UTC)</Text>
          <Text style={styles.streakValue}>
            {String(streakCount)} {ruDaysWord(streakCount)} подряд
          </Text>
          {streakDay ? (
            <Text style={styles.streakSub}>
              Последний засчитанный день: {streakDay}
            </Text>
          ) : (
            <Text style={styles.streakSub}>
              Засчитывается завершение урока (без дубля в тот же день).
            </Text>
          )}
          <View style={styles.calSummary}>
            {calLoading ? (
              <View style={styles.calSummaryRow}>
                <ActivityIndicator color={theme.tint} size="small" />
                <Text style={styles.calSummaryText}> Календарь…</Text>
              </View>
            ) : (
              <Text style={styles.calSummaryText}>
                Активных дней в этом месяце: {String(daysPracticedInMonth)}
              </Text>
            )}
            {calError != null ? (
              <Text style={styles.errCal}>{calError}</Text>
            ) : null}
          </View>
          {!calLoading && calError == null ? (
            <StreakMonthCalendar
              activeDays={activeDays}
              month={calMonth}
              onNextMonth={onCalNext}
              onPrevMonth={onCalPrev}
              todayKey={todayKey}
              year={calYear}
            />
          ) : null}
          <Text style={styles.calHint}>
            Подсветка — дни, когда завершён хотя бы один урок (дата в UTC, как
            в стрике).
          </Text>
          {streakError ? <Text style={styles.err}>{streakError}</Text> : null}
          <Pressable
            style={styles.streakReset}
            onPress={onResetStreak}
            disabled={resetStreakLoading}
            accessibilityLabel="Сбросить стрик для теста"
          >
            {resetStreakLoading ? (
              <ActivityIndicator color={theme.textMuted} size="small" />
            ) : (
              <Text style={styles.streakResetText}>
                Сбросить стрик (тест)
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
      <Text style={styles.caption}>
        Недавние курсы и достижения — в следующих фазах.
      </Text>
      {isLoggedIn && user && showSetupPriorities ? (
        <Pressable
          style={styles.primaryOutline}
          onPress={onOpenOnboardingSettings}
          accessibilityLabel="Настроить приоритеты тем"
        >
          <Text style={styles.primaryOutlineText}>
            Настроить приоритеты тем
          </Text>
        </Pressable>
      ) : null}
      {isLoggedIn && user?.onboardingCompletedAt != null ? (
        <Pressable
          style={styles.replayButton}
          onPress={onReplayOnboarding}
          disabled={replayLoading}
          accessibilityLabel="Повторить онбординг"
        >
          {replayLoading ? (
            <ActivityIndicator color={theme.tint} />
          ) : (
            <Text style={styles.replayText}>Повторить онбординг</Text>
          )}
        </Pressable>
      ) : null}
      {isLoggedIn ? (
        <Pressable
          style={styles.button}
          onPress={onSignOut}
          accessibilityLabel="Выйти"
        >
          <Text style={styles.buttonText}>Выйти</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function createProfileStyles(t: AppTokens) {
  return StyleSheet.create({
    button: {
      alignSelf: 'flex-start',
      backgroundColor: t.error,
      borderRadius: 12,
      marginTop: 20,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    calHint: {
      color: t.textMuted,
      fontSize: 12,
      lineHeight: 16,
      marginTop: 10,
    },
    calSummary: { marginTop: 10 },
    calSummaryRow: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    calSummaryText: { color: t.text, fontSize: 15, fontWeight: '700' },
    caption: {
      color: t.textSecondary,
      fontSize: 15,
      marginTop: 12,
      lineHeight: 22,
    },
    err: { color: t.error, fontSize: 14, marginTop: 6, fontWeight: '500' },
    errCal: { color: t.error, fontSize: 14, marginTop: 4 },
    primaryOutline: {
      alignSelf: 'flex-start',
      backgroundColor: t.tintMuted,
      borderRadius: 12,
      marginTop: 16,
      minHeight: 44,
      minWidth: 240,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    primaryOutlineText: {
      color: t.link,
      fontSize: 16,
      fontWeight: '800',
    },
    replayButton: {
      alignSelf: 'flex-start',
      borderColor: t.tint,
      borderRadius: 12,
      borderWidth: 1.5,
      marginTop: 12,
      minHeight: 44,
      minWidth: 200,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    replayText: { color: t.link, fontSize: 16, fontWeight: '700' },
    scroll: { flex: 1 },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    streakCard: {
      backgroundColor: t.surface,
      borderColor: t.borderSubtle,
      borderRadius: 16,
      borderWidth: 1,
      marginTop: 12,
      padding: 18,
    },
    streakReset: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6 },
    streakResetText: {
      color: t.textMuted,
      fontSize: 14,
      textDecorationLine: 'underline',
    },
    streakSub: { color: t.textSecondary, fontSize: 14, marginTop: 4 },
    streakTitle: { color: t.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
    streakValue: { color: t.tint, fontSize: 24, fontWeight: '800', marginTop: 4 },
    title: {
      color: t.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    userBlock: { marginTop: 12 },
    userEmail: { color: t.textSecondary, fontSize: 16, marginTop: 4 },
    userName: { color: t.text, fontSize: 18, fontWeight: '700' },
  });
}
