import { useAuth } from '@/contexts/AuthContext';
import { fetchCategoryLessons } from '@/lib/api/app-lessons';
import { ApiError } from '@/lib/api';
import type { AppLessonListItem } from '@/lib/api/types/lessons.types';
import { UserLessonProgressStatus } from '@/lib/api/types/lessons.types';
import type { AppTokens } from '@/constants/theme';
import { pickLocalized } from '@/lib/i18n/pick-localized';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function progressForLesson(lesson: AppLessonListItem): { main: string; extra: string | null } {
  const p = lesson.progress;
  if (p == null) {
    return { main: 'Не начат', extra: null };
  }
  if (p.status === UserLessonProgressStatus.COMPLETED) {
    const at = p.lessonCompletedAt;
    const extra =
      at != null && at.length > 0
        ? `Завершён: ${new Date(at).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : 'Урок отмечен как выполненный';
    return { main: 'Выполнено', extra };
  }
  if (p.percentComplete > 0) {
    return { main: `Прогресс ${p.percentComplete}%`, extra: 'В процессе' };
  }
  return { main: 'Не начат', extra: null };
}

export default function CategoryLessonsScreen(): React.JSX.Element {
  const { isLoggedIn, isReady } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => createCategoryStyles(theme), [theme]);
  const { id, title: titleParam } = useLocalSearchParams<{
    id: string;
    title?: string;
  }>();
  const [lessons, setLessons] = useState<AppLessonListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hadFocusForCategoryId = useRef<string | null>(null);

  const load = useCallback(
    async (options: { silent: boolean } = { silent: false }) => {
      if (id == null) {
        return;
      }
      if (!options.silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await fetchCategoryLessons(id);
        setLessons(data);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Ошибка загрузки';
        setError(msg);
      } finally {
        if (!options.silent) {
          setLoading(false);
        }
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      if (!isReady || !isLoggedIn || !id) {
        return;
      }
      const silent = hadFocusForCategoryId.current === id;
      hadFocusForCategoryId.current = id;
      void load({ silent });
    }, [isReady, isLoggedIn, id, load]),
  );

  if (id == null) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={styles.muted}>Некорректная ссылка.</Text>
      </View>
    );
  }

  const headerTitle =
    typeof titleParam === 'string' && titleParam.length > 0
      ? titleParam
      : 'Категория';

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <Text style={styles.heading}>{headerTitle}</Text>
      {loading && (
        <View style={styles.centerRow}>
          <ActivityIndicator color={theme.tint} size="small" />
          <Text style={styles.muted}> Загрузка…</Text>
        </View>
      )}
      {error != null && <Text style={styles.err}>{error}</Text>}
      {!loading &&
        !error &&
        lessons.map((lesson) => {
          const { main, extra } = progressForLesson(lesson);
          const done =
            lesson.progress?.status === UserLessonProgressStatus.COMPLETED;
          const startLabel = done ? 'Пройти повторно' : 'Начать';
          return (
            <View
              key={lesson.id}
              style={[styles.card, done ? styles.cardDone : null]}
            >
              <Text style={styles.cardTitle}>{pickLocalized(lesson.title)}</Text>
              <Text
                style={[styles.cardSub, done ? styles.cardSubDone : null]}
              >
                {main}
              </Text>
              {extra != null ? (
                <Text style={styles.cardExtra}>{extra}</Text>
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  styles.startBtn,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={() => {
                  router.push({
                    pathname: '/(app)/lesson/[id]',
                    params: {
                      id: lesson.id,
                      title: pickLocalized(lesson.title),
                    },
                  });
                }}
              >
                <Text style={styles.startBtnText}>{startLabel}</Text>
              </Pressable>
            </View>
          );
        })}
    </ScrollView>
  );
}

function createCategoryStyles(t: AppTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: t.surface,
      borderColor: t.borderSubtle,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 12,
      padding: 16,
    },
    cardDone: {
      backgroundColor: t.successSurface,
      borderColor: t.successMuted,
    },
    cardExtra: {
      color: t.textMuted,
      fontSize: 13,
      marginTop: 4,
    },
    cardSub: {
      color: t.textSecondary,
      fontSize: 14,
      marginTop: 4,
    },
    cardSubDone: {
      color: t.successMuted,
      fontWeight: '700',
    },
    cardTitle: {
      color: t.text,
      fontSize: 17,
      fontWeight: '700',
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    centerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 8,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    err: {
      color: t.error,
      fontWeight: '500',
      marginTop: 8,
    },
    heading: {
      color: t.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: 16,
    },
    muted: {
      color: t.textSecondary,
      fontSize: 15,
    },
    startBtn: {
      alignSelf: 'flex-start',
      backgroundColor: t.tint,
      borderRadius: 12,
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    startBtnText: {
      color: t.tintForeground,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
