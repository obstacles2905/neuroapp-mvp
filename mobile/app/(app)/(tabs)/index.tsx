import { useAuth } from '@/contexts/AuthContext';
import { MndSessionStepRow } from '@/components/mnd/MndSessionStepRow';
import { ApiError } from '@/lib/api';
import { fetchDailyMndSession } from '@/lib/api/app-mnd-session';
import { fetchAppCategories } from '@/lib/api/app-catalog';
import type { AppDailyMndSession } from '@/lib/api/types/mnd-session.types';
import type { AppCategoryListItem } from '@/lib/api/types/onboarding.types';
import {
  buildPriorityRankMap,
  sortCatalogForUser,
} from '@/lib/learn/sort-categories-for-user';
import { pickLocalized } from '@/lib/i18n/pick-localized';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
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

function categoryProgressA11yLabel(
  hasLessons: boolean,
  pct: number,
  isFullyDone: boolean,
): string {
  if (!hasLessons) {
    return 'Нет опубликованных уроков';
  }
  if (isFullyDone) {
    return 'Курс пройден полностью';
  }
  return `Прогресс курса ${pct} процентов`;
}

export default function LearnHomeScreen(): React.JSX.Element {
  const { isLoggedIn, isReady, user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<AppCategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AppDailyMndSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionErr, setSessionErr] = useState<string | null>(null);
  const hadTabFocus = useRef(false);
  const t = useAppTheme();
  const styles = useMemo(() => createLearnHomeStyles(t), [t]);

  const loadSession = useCallback(async () => {
    const symptomIds = user?.prioritizedSymptomIds ?? [];
    if (symptomIds.length === 0) {
      setSession(null);
      setSessionErr(null);
      return;
    }
    setSessionLoading(true);
    setSessionErr(null);
    try {
      const data = await fetchDailyMndSession();
      setSession(data);
    } catch (e) {
      setSession(null);
      setSessionErr(
        e instanceof ApiError ? e.message : 'Не удалось собрать сессию MND',
      );
    } finally {
      setSessionLoading(false);
    }
  }, [user?.prioritizedSymptomIds]);

  const load = useCallback(async (options: { silent?: boolean } = {}) => {
    const silent = options.silent === true;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await fetchAppCategories();
      setCategories(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Ошибка загрузки';
      setError(msg);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isReady || !isLoggedIn) {
        return;
      }
      const silent = hadTabFocus.current;
      hadTabFocus.current = true;
      void load({ silent });
      void loadSession();
    }, [isReady, isLoggedIn, load, loadSession]),
  );

  const hasMndSymptoms = (user?.prioritizedSymptomIds?.length ?? 0) > 0;

  const priorityIds = useMemo(
    () => user?.prioritizedCategoryIds ?? [],
    [user?.prioritizedCategoryIds],
  );
  const hasPriority = priorityIds.length > 0;
  const sortedCategories = useMemo(
    () => sortCatalogForUser(categories, priorityIds),
    [categories, priorityIds],
  );
  const rankById = useMemo(
    () => buildPriorityRankMap(priorityIds),
    [priorityIds],
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={{ backgroundColor: t.background, flex: 1 }}
    >
      <Text style={styles.kicker}>Обучение</Text>
      <Text style={styles.title}>Учёба</Text>
      {hasMndSymptoms ? (
        <View style={styles.mndSurface}>
          <Text style={styles.sectionTitle}>Сегодня</Text>
          <Text style={styles.caption}>
            Персональный набор упражнений по симптомам с онбординга и
            MND-матрице. День (UTC):{' '}
            {session?.dayKeyUtc ?? '…'}
          </Text>
          {sessionLoading ? (
            <View style={styles.row}>
              <ActivityIndicator color={t.tint} size="small" />
              <Text style={styles.caption}> Собираем сессию…</Text>
            </View>
          ) : null}
          {sessionErr != null ? (
            <Text style={styles.err}>{sessionErr}</Text>
          ) : null}
          {session != null && session.steps.length > 0
            ? session.steps.map((step, idx) => (
                <MndSessionStepRow
                  key={step.id}
                  index={idx}
                  step={step}
                  onPress={() => {
                    router.push({
                      pathname: '/(app)/mnd-exercise/[id]',
                      params: {
                        id: step.id,
                        title: pickLocalized(step.title),
                      },
                    } as Href);
                  }}
                />
              ))
            : null}
          {session != null ? (
            <Text style={styles.mndSummary}>
              Средняя доля «снизу вверх»: {String(session.avgBottomUpPercent)}%
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, styles.catalogHeading]}>Каталог</Text>
      {hasPriority ? (
        <Text style={styles.caption}>
          Сначала выбраны темы с онбординга (ваши приоритеты), далее — остальные
          по порядку каталога.
        </Text>
      ) : hasMndSymptoms ? (
        <Text style={styles.caption}>
          Классические курсы по категориям (если опубликованы в админке). Симптомы
          и персональная сессия — в блоке «Сегодня» выше.
        </Text>
      ) : (
        <Text style={styles.caption}>
          Категории в порядке каталога. Чтобы настроить симптомы MND, откройте
          онбординг в профиле.
        </Text>
      )}
      {loading && (
        <View style={styles.row}>
          <ActivityIndicator color={t.tint} size="small" />
          <Text style={styles.caption}> Загрузка…</Text>
        </View>
      )}
      {error != null && <Text style={styles.err}>{error}</Text>}
      {!loading && !error && categories.length === 0 && (
        <Text style={styles.caption}>
          Категории пока не опубликованы. Загляните позже.
        </Text>
      )}
      {!loading &&
        !error &&
        sortedCategories.map((c) => {
          const r = rankById.get(c.id);
          const isPriority = r !== undefined;
          const lessonCount = c.publishedLessonsCount;
          const hasLessons = lessonCount > 0;
          const pct = Math.min(100, Math.max(0, c.percentComplete));
          const isFullyDone = hasLessons && pct >= 100;
          const a11yProgress = categoryProgressA11yLabel(
            hasLessons,
            pct,
            isFullyDone,
          );
          return (
            <Pressable
              key={c.id}
              style={({ pressed }) => [
                styles.card,
                isPriority ? styles.cardPriority : null,
                { opacity: pressed ? 0.88 : 1 },
              ]}
              onPress={() => {
                router.push({
                  pathname: '/(app)/category/[id]',
                  params: { id: c.id, title: pickLocalized(c.title) },
                });
              }}
            >
              {isPriority ? (
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      Ваш приоритет · #{String(r)}
                    </Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {pickLocalized(c.title)}
                </Text>
                <View
                  accessibilityLabel={a11yProgress}
                  accessible
                  style={styles.progressCol}
                >
                  {!hasLessons ? (
                    <Text style={styles.progressDash}>—</Text>
                  ) : (
                    <>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            isFullyDone ? styles.progressFillDone : null,
                            { width: `${pct}%` },
                          ]}
                        />
                      </View>
                      <View style={styles.progressPctRow}>
                        {isFullyDone ? (
                          <FontAwesome
                            color={t.success}
                            name="check"
                            size={14}
                            style={styles.progressCheck}
                          />
                        ) : null}
                        <Text
                          style={[
                            styles.progressPct,
                            isFullyDone ? styles.progressPctDone : null,
                          ]}
                        >
                          {pct}%
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
              <Text style={styles.cardHint}>Смотреть уроки →</Text>
            </Pressable>
          );
        })}
    </ScrollView>
  );
}

function createLearnHomeStyles(t: AppTokens) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: t.tintMuted,
      borderRadius: 8,
      marginBottom: 8,
    },
    badgeRow: { flexDirection: 'row' },
    badgeText: {
      color: t.link,
      fontSize: 12,
      fontWeight: '700',
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    caption: {
      color: t.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 8,
    },
    card: {
      backgroundColor: t.surface,
      borderColor: t.borderSubtle,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 12,
      padding: 16,
    },
    cardHint: {
      color: t.link,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 8,
    },
    cardPriority: {
      backgroundColor: t.tintMuted,
      borderColor: t.tint,
      borderWidth: 1.5,
    },
    cardTitle: {
      color: t.text,
      flex: 1,
      flexShrink: 1,
      fontSize: 17,
      fontWeight: '700',
      marginRight: 12,
      paddingRight: 4,
    },
    catalogHeading: { marginTop: 10 },
    kicker: {
      color: t.tint,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.4,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    progressCol: {
      alignItems: 'flex-end',
      flexShrink: 0,
      justifyContent: 'center',
      minHeight: 32,
      width: 80,
    },
    progressDash: {
      color: t.textMuted,
      fontSize: 22,
      fontWeight: '300',
      lineHeight: 26,
    },
    progressFill: {
      backgroundColor: t.tint,
      borderRadius: 999,
      height: '100%',
    },
    progressFillDone: {
      backgroundColor: t.success,
    },
    progressCheck: {
      marginRight: 4,
    },
    progressPct: {
      color: t.textSecondary,
      fontSize: 12,
      fontWeight: '600',
    },
    progressPctDone: {
      color: t.successMuted,
    },
    progressPctRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 4,
    },
    progressTrack: {
      backgroundColor: t.borderSubtle,
      borderRadius: 999,
      height: 6,
      overflow: 'hidden',
      width: '100%',
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    err: {
      color: t.error,
      marginTop: 8,
      fontWeight: '500',
    },
    mndSummary: {
      color: t.textMuted,
      fontSize: 13,
      marginTop: 10,
    },
    mndSurface: {
      backgroundColor: t.surface,
      borderColor: t.borderSubtle,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 24,
      padding: 16,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 8,
    },
    sectionTitle: {
      color: t.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.2,
      marginBottom: 6,
      marginTop: 2,
    },
    title: {
      color: t.text,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.6,
      marginBottom: 8,
    },
  });
}
