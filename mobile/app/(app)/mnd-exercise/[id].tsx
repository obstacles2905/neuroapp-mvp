import { CompletionCelebrationModal } from '@/components/lesson/CompletionCelebrationModal';
import { LessonStepContent } from '@/components/lesson/LessonStepContent';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import {
  completeMndExercise,
  fetchMndExerciseDetail,
} from '@/lib/api/app-mnd-exercise';
import type { AppMndExerciseDetail } from '@/lib/api/types/mnd-exercise.types';
import type { LessonStepInBlock } from '@/lib/lesson/flatten-lesson-blocks';
import { flattenLessonBlocks } from '@/lib/lesson/flatten-lesson-blocks';
import { LESSON_BLOCK_SECTION_TITLES } from '@/lib/lesson/lesson-block-section-titles';
import { pickLocalized } from '@/lib/i18n/pick-localized';
import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { type Href, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function stepsWithFallback(detail: AppMndExerciseDetail): LessonStepInBlock[] {
  const flat = flattenLessonBlocks(detail.blocks);
  if (flat.length > 0) {
    return flat;
  }
  const text = pickLocalized(detail.title);
  return [
    {
      step: {
        id: `mnd-fallback-${detail.id}`,
        order: 0,
        type: 'theory',
        content: {
          display_mode: 'all',
          sentences: { ru: [text], uk: [text], en: [text] },
        },
      },
      blockType: 'what_exercise',
    },
  ];
}

export default function MndExercisePlayerScreen(): React.JSX.Element {
  const { refreshUser } = useAuth();
  const { id, title: titleParam, fromJam } = useLocalSearchParams<{
    id: string;
    title?: string;
    fromJam?: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();
  const [exercise, setExercise] = useState<AppMndExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);

  const theme = useAppTheme();
  const styles = useMemo(() => createMndExerciseStyles(theme), [theme]);

  const dismissCompletionAndLeave = useCallback(() => {
    setCompletionModalVisible(false);
    router.back();
  }, [router]);

  const load = useCallback(async () => {
    if (id == null) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMndExerciseDetail(id);
      setExercise(data);
      setStepIndex(0);
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
    () => (exercise == null ? [] : stepsWithFallback(exercise)),
    [exercise],
  );
  const currentEntry = steps[stepIndex];
  const current = currentEntry?.step;
  const total = steps.length;
  const blockSectionTitle =
    currentEntry != null ? LESSON_BLOCK_SECTION_TITLES[currentEntry.blockType] : null;
  const title =
    typeof titleParam === 'string' && titleParam.length > 0
      ? titleParam
      : exercise
        ? pickLocalized(exercise.title)
        : 'Упражнение';

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  const goNext = useCallback(() => {
    if (exercise == null || current == null || id == null) {
      return;
    }
    const isLast = stepIndex >= total - 1;
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    void (async () => {
      setSyncing(true);
      try {
        await completeMndExercise(id, {
          fromJam: fromJam === '1' || fromJam === 'true',
        });
        await refreshUser();
        setCompletionModalVisible(true);
      } catch {
        router.replace('/(app)/(tabs)' as Href);
      } finally {
        setSyncing(false);
      }
    })();
  }, [
    current,
    exercise,
    fromJam,
    id,
    refreshUser,
    router,
    stepIndex,
    total,
  ]);

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
        <Text style={styles.muted}>Некорректное упражнение.</Text>
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

  if (exercise == null || total === 0 || current == null) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={styles.muted}>Нет шагов для отображения.</Text>
        <Pressable style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
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
        <Pressable style={styles.btnGhost} onPress={goBack} disabled={syncing}>
          <Text style={styles.btnGhostText}>
            {stepIndex <= 0 ? 'К сессии' : 'Назад'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.btn, syncing && styles.btnDisabled]}
          onPress={goNext}
          disabled={syncing}
        >
          <Text style={styles.btnText}>
            {stepIndex >= total - 1 ? 'Завершить' : 'Дальше'}
          </Text>
        </Pressable>
      </View>
      <CompletionCelebrationModal
        visible={completionModalVisible}
        title="Задание выполнено!"
        subtitle="Прогресс сохранён. На вкладке «Учёба» можно продолжить сессию или открыть каталог."
        primaryLabel="Вернуться к учёбе"
        onRequestClose={dismissCompletionAndLeave}
        onPrimaryPress={dismissCompletionAndLeave}
      />
    </View>
  );
}

function createMndExerciseStyles(t: AppTokens) {
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
    blockSectionTitle: {
      color: t.text,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 24,
      marginBottom: 14,
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
    progressLabel: {
      color: t.textSecondary,
      fontSize: 14,
      marginBottom: 8,
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
