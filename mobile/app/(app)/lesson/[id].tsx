import { useAuth } from '@/contexts/AuthContext';
import { CompletionCelebrationModal } from '@/components/lesson/CompletionCelebrationModal';
import { LessonStepContent } from '@/components/lesson/LessonStepContent';
import { fetchLesson, updateLessonProgress } from '@/lib/api/app-lessons';
import { ApiError } from '@/lib/api';
import {
  UserLessonProgressStatus,
  type AppLessonDetail,
} from '@/lib/api/types/lessons.types';
import { pickLocalized } from '@/lib/i18n/pick-localized';
import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { LESSON_BLOCK_SECTION_TITLES } from '@/lib/lesson/lesson-block-section-titles';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { flattenLessonBlocks } from '@/lib/lesson/flatten-lesson-blocks';

function formatLessonCompletedLine(iso: string | null): string | null {
  if (iso == null || iso.length === 0) {
    return null;
  }
  return `Завершён: ${new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function LessonPlayerScreen(): React.JSX.Element {
  const { refreshUser } = useAuth();
  const { id, title: titleParam } = useLocalSearchParams<{
    id: string;
    title?: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const [lesson, setLesson] = useState<AppLessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const theme = useAppTheme();
  const styles = useMemo(() => createLessonPlayerStyles(theme), [theme]);

  const load = useCallback(async () => {
    if (id == null) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLesson(id);
      setLesson(data);
      const steps = flattenLessonBlocks(data.blocks);
      const p = data.progress;
      if (p?.status === UserLessonProgressStatus.COMPLETED) {
        setStepIndex(0);
      } else {
        const lastId = p?.lastViewedStepId;
        if (lastId != null && lastId.length > 0 && steps.length > 0) {
          const j = steps.findIndex((item) => item.step.id === lastId);
          if (j >= 0) {
            setStepIndex(j);
          } else {
            setStepIndex(0);
          }
        } else {
          setStepIndex(0);
        }
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Ошибка загрузки';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      setCompletionModalVisible(false);
      void load();
    }
  }, [id, load]);

  const steps = useMemo(
    () => (lesson == null ? [] : flattenLessonBlocks(lesson.blocks)),
    [lesson],
  );
  const currentEntry = steps[stepIndex];
  const current = currentEntry?.step;
  const total = steps.length;
  const isLessonCompleted =
    lesson?.progress?.status === UserLessonProgressStatus.COMPLETED;
  const completedAtLine = formatLessonCompletedLine(
    lesson?.progress?.lessonCompletedAt ?? null,
  );
  const blockSectionTitle =
    currentEntry != null ? LESSON_BLOCK_SECTION_TITLES[currentEntry.blockType] : null;
  const title =
    typeof titleParam === 'string' && titleParam.length > 0
      ? titleParam
      : lesson
        ? pickLocalized(lesson.title)
        : 'Урок';

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  useEffect(() => {
    if (lesson == null || total === 0) {
      return;
    }
    if (current == null) {
      return;
    }
    const p = lesson.progress;
    if (
      p?.status === UserLessonProgressStatus.IN_PROGRESS ||
      p?.status === UserLessonProgressStatus.COMPLETED
    ) {
      return;
    }
    let cancelled = false;
    void (async () => {
      setSyncing(true);
      try {
        const next = await updateLessonProgress(lesson.id, {
          status: UserLessonProgressStatus.IN_PROGRESS,
          percentComplete: 0,
          lastViewedStepId: current.id,
        });
        if (cancelled) {
          return;
        }
        setLesson((prev) => (prev ? { ...prev, progress: next } : prev));
      } catch {
        // offline / optimistic — остаёмся в локальном состоянии
      } finally {
        if (!cancelled) {
          setSyncing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lesson, total, current]);

  const dismissCompletionAndLeave = useCallback(() => {
    setCompletionModalVisible(false);
    router.back();
  }, [router]);

  const goNext = useCallback(() => {
    if (lesson == null || current == null) {
      return;
    }
    const isLast = stepIndex >= total - 1;
    if (
      isLast &&
      lesson.progress?.status === UserLessonProgressStatus.COMPLETED
    ) {
      router.back();
      return;
    }
    const nextPercent = isLast
      ? 100
      : Math.min(
          100,
          Math.round(((stepIndex + 1) / total) * 100),
        );
    const nextStatus = isLast
      ? UserLessonProgressStatus.COMPLETED
      : UserLessonProgressStatus.IN_PROGRESS;
    const nextLastId = isLast
      ? current.id
      : steps[stepIndex + 1]!.step.id;

    void (async () => {
      setSyncing(true);
      try {
        const progress = await updateLessonProgress(lesson.id, {
          status: nextStatus,
          percentComplete: nextPercent,
          lastViewedStepId: isLast ? current.id : nextLastId,
        });
        setLesson((prev) => (prev ? { ...prev, progress: progress } : prev));
        if (isLast) {
          await refreshUser();
          setCompletionModalVisible(true);
        } else {
          setStepIndex((i) => i + 1);
        }
      } catch {
        if (!isLast) {
          setStepIndex((i) => i + 1);
        }
      } finally {
        setSyncing(false);
      }
    })();
  }, [current, lesson, refreshUser, router, stepIndex, steps, total]);

  const goBack = useCallback(() => {
    if (stepIndex <= 0) {
      router.back();
      return;
    }
    setStepIndex((i) => i - 1);
  }, [router, stepIndex]);

  if (id == null) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={styles.muted}>Некорректный урок.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} size="large" />
        <Text style={styles.muted}> Загрузка…</Text>
      </View>
    );
  }

  if (error != null) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={styles.err}>{error}</Text>
        <Pressable style={styles.btn} onPress={() => void load()}>
          <Text style={styles.btnText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  if (lesson == null || total === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={styles.muted}>В уроке пока нет шагов.</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  if (current == null) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} size="large" />
      </View>
    );
  }

  const primaryNavLabel =
    isLessonCompleted && stepIndex >= total - 1
      ? 'К списку'
      : stepIndex >= total - 1
        ? 'Завершить'
        : 'Дальше';

  return (
    <View style={styles.root}>
      {isLessonCompleted ? (
        <View style={styles.completedBanner} accessibilityLabel="Урок пройден">
          <Text style={styles.completedBannerTitle}>Урок пройден</Text>
          {completedAtLine != null ? (
            <Text style={styles.completedBannerSub}>{completedAtLine}</Text>
          ) : (
            <Text style={styles.completedBannerSub}>
              Вы уже завершили этот урок
            </Text>
          )}
        </View>
      ) : null}
      <Text style={styles.progressLabel}>
        Шаг {stepIndex + 1} из {total}
        {syncing ? ' · сохраняем…' : ''}
      </Text>
      <View style={styles.stepArea}>
        {blockSectionTitle != null ? (
          <Text style={styles.blockSectionTitle}>{blockSectionTitle}</Text>
        ) : null}
        <LessonStepContent step={current} />
      </View>
      <View style={styles.nav}>
        <Pressable
          style={styles.btnGhost}
          onPress={goBack}
          disabled={syncing}
        >
          <Text style={styles.btnGhostText}>
            {stepIndex <= 0 ? 'К списку' : 'Назад'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.btn, syncing && styles.btnDisabled]}
          onPress={goNext}
          disabled={syncing}
        >
          <Text style={styles.btnText}>{primaryNavLabel}</Text>
        </Pressable>
      </View>
      <CompletionCelebrationModal
        visible={completionModalVisible}
        title="Урок пройден!"
        subtitle="Прогресс сохранён — в списке уроков это отмечено как выполненное."
        primaryLabel="К списку уроков"
        onRequestClose={dismissCompletionAndLeave}
        onPrimaryPress={dismissCompletionAndLeave}
      />
    </View>
  );
}

function createLessonPlayerStyles(t: AppTokens) {
  return StyleSheet.create({
    btn: {
      alignItems: 'center',
      backgroundColor: t.tint,
      borderRadius: 14,
      justifyContent: 'center',
      minWidth: 128,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnGhost: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    btnGhostText: {
      color: t.link,
      fontSize: 16,
      fontWeight: '600',
    },
    btnText: {
      color: t.tintForeground,
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    err: {
      color: t.error,
      marginBottom: 12,
      textAlign: 'center',
      fontWeight: '500',
    },
    muted: {
      color: t.textSecondary,
      fontSize: 15,
    },
    nav: {
      backgroundColor: t.surface,
      borderTopColor: t.borderSubtle,
      borderTopWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
    },
    completedBanner: {
      backgroundColor: t.successSurface,
      borderColor: t.successMuted,
      borderRadius: 14,
      borderWidth: 1,
      marginBottom: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    completedBannerSub: {
      color: t.successMuted,
      fontSize: 13,
      marginTop: 4,
    },
    completedBannerTitle: {
      color: t.successMuted,
      fontSize: 16,
      fontWeight: '800',
    },
    progressLabel: {
      color: t.textSecondary,
      fontSize: 14,
      marginBottom: 8,
    },
    blockSectionTitle: {
      color: t.text,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 24,
      marginBottom: 14,
    },
    root: {
      backgroundColor: t.background,
      flex: 1,
      padding: 16,
    },
    stepArea: {
      flex: 1,
      marginBottom: 8,
    },
  });
}
