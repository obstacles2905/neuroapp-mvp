import { useAuth } from '@/contexts/AuthContext';
import { MndSessionStepRow } from '@/components/mnd/MndSessionStepRow';
import { ApiError } from '@/lib/api';
import { fetchJamMndSession } from '@/lib/api/app-mnd-session';
import type { AppDailyMndSession } from '@/lib/api/types/mnd-session.types';
import type { AppTokens } from '@/constants/theme';
import { pickLocalized } from '@/lib/i18n/pick-localized';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFocusEffect } from '@react-navigation/native';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function JamScreen(): React.JSX.Element {
  const { isLoggedIn, isReady, user } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => createJamStyles(theme), [theme]);
  const [session, setSession] = useState<AppDailyMndSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isReady || !isLoggedIn) {
      return;
    }
    const symptomIds = user?.prioritizedSymptomIds ?? [];
    if (symptomIds.length === 0) {
      setSession(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJamMndSession();
      setSession(data);
    } catch (e) {
      setSession(null);
      setError(
        e instanceof ApiError ? e.message : 'Не удалось собрать джем-сессию',
      );
    } finally {
      setLoading(false);
    }
  }, [isReady, isLoggedIn, user?.prioritizedSymptomIds]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const hasSymptoms = (user?.prioritizedSymptomIds?.length ?? 0) > 0;

  if (!isReady || !isLoggedIn) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={styles.title}>Джем</Text>
        <Text style={styles.caption}>Войдите, чтобы открыть повторение.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <Text style={styles.title}>Джем-сессия</Text>
      <Text style={styles.lead}>
        Упражнения из вашей «солянки» симптомов — только то, что вы уже
        проходили. Новые карточки сюда не попадают: сначала завершите их в
        «Сегодня» или в SOS.
      </Text>
      {!hasSymptoms ? (
        <Text style={styles.caption}>
          Нужны симптомы с онбординга. Настройте профиль в разделе онбординга.
        </Text>
      ) : null}
      {hasSymptoms ? (
        <>
          {loading ? (
            <View style={styles.row}>
              <ActivityIndicator color={theme.tint} size="small" />
              <Text style={styles.caption}> Собираем повторение…</Text>
            </View>
          ) : null}
          {error != null ? <Text style={styles.err}>{error}</Text> : null}
          {session != null ? (
            <>
              <Text style={styles.sectionTitle}>Набор на сегодня (UTC)</Text>
              <Text style={styles.caption}>
                День: {session.dayKeyUtc}. Шагов: {String(session.steps.length)}.
              </Text>
              {session.steps.map((step, idx) => (
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
                        fromJam: '1',
                      },
                    } as Href);
                  }}
                />
              ))}
              <Text style={styles.summary}>
                Средняя доля «снизу вверх»:{' '}
                {String(session.avgBottomUpPercent)}%
              </Text>
            </>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

function createJamStyles(t: AppTokens) {
  return StyleSheet.create({
    caption: {
      color: t.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 8,
    },
    centered: {
      flex: 1,
      padding: 20,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    err: {
      color: t.error,
      fontWeight: '500',
      marginBottom: 8,
    },
    lead: {
      color: t.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 14,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 10,
    },
    sectionTitle: {
      color: t.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.2,
      marginBottom: 4,
    },
    summary: {
      color: t.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 10,
    },
    title: {
      color: t.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.4,
      marginBottom: 8,
    },
  });
}
