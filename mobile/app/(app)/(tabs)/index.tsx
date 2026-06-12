import { useAuth } from '@/contexts/AuthContext';
import { MndSessionStepRow } from '@/components/mnd/MndSessionStepRow';
import { ApiError } from '@/lib/api';
import { fetchDailyMndSession } from '@/lib/api/app-mnd-session';
import type { AppDailyMndSession } from '@/lib/api/types/mnd-session.types';
import { pickLocalized } from '@/lib/i18n/pick-localized';
import { useFocusEffect } from '@react-navigation/native';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function LearnHomeScreen(): React.JSX.Element {
  const { isLoggedIn, isReady, user } = useAuth();
  const router = useRouter();
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

  useFocusEffect(
    useCallback(() => {
      if (!isReady || !isLoggedIn) {
        return;
      }
      hadTabFocus.current = true;
      void loadSession();
    }, [isReady, isLoggedIn, loadSession]),
  );

  const hasMndSymptoms = (user?.prioritizedSymptomIds?.length ?? 0) > 0;

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
          {session != null && session.steps.length === 0 ? (
            <Text style={styles.caption}>
              На сегодня упражнений нет. Проверьте публикацию в MND Protocol.
            </Text>
          ) : null}
          {session != null ? (
            <Text style={styles.mndSummary}>
              Средняя доля «снизу вверх»: {String(session.avgBottomUpPercent)}%
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={styles.caption}>
          Чтобы получить персональную сессию, пройдите онбординг и выберите
          симптомы в профиле.
        </Text>
      )}
    </ScrollView>
  );
}

function createLearnHomeStyles(t: AppTokens) {
  return StyleSheet.create({
    caption: {
      color: t.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 8,
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
    kicker: {
      color: t.tint,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.4,
      marginBottom: 4,
      textTransform: 'uppercase',
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
