import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  type Href,
  useRouter,
} from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MndSessionStepRow } from '@/components/mnd/MndSessionStepRow';
import type { AppTokens } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ApiError } from '@/lib/api';
import { fetchSosMndSession } from '@/lib/api/app-mnd-session';
import { fetchOnboardingSymptoms } from '@/lib/api/app-onboarding';
import type { AppDailyMndSession } from '@/lib/api/types/mnd-session.types';
import type { AppSymptomListItem } from '@/lib/api/types/onboarding.types';
import { pickLocalized } from '@/lib/i18n/pick-localized';
import { useFocusEffect } from '@react-navigation/native';

export default function NowScreen(): React.JSX.Element {
  const { isLoggedIn, isReady } = useAuth();
  const router = useRouter();
  const [symptoms, setSymptoms] = useState<AppSymptomListItem[]>([]);
  const [symptomsLoading, setSymptomsLoading] = useState(false);
  const [symptomsErr, setSymptomsErr] = useState<string | null>(null);
  const [sosSession, setSosSession] = useState<AppDailyMndSession | null>(null);
  const [sosLoadingId, setSosLoadingId] = useState<string | null>(null);
  const [sosErr, setSosErr] = useState<string | null>(null);
  const theme = useAppTheme();
  const styles = useMemo(() => createNowStyles(theme), [theme]);

  const loadSymptoms = useCallback(async () => {
    if (!isReady || !isLoggedIn) {
      return;
    }
    setSymptomsLoading(true);
    setSymptomsErr(null);
    try {
      const list = await fetchOnboardingSymptoms();
      setSymptoms([...list].sort((a, b) => a.order - b.order));
    } catch (e) {
      setSymptoms([]);
      setSymptomsErr(
        e instanceof ApiError ? e.message : 'Не удалось загрузить симптомы',
      );
    } finally {
      setSymptomsLoading(false);
    }
  }, [isReady, isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      void loadSymptoms();
    }, [loadSymptoms]),
  );

  const onPickSymptom = useCallback(async (symptomId: string) => {
    setSosErr(null);
    setSosLoadingId(symptomId);
    try {
      const data = await fetchSosMndSession(symptomId);
      setSosSession(data);
    } catch (e) {
      setSosSession(null);
      setSosErr(
        e instanceof ApiError
          ? e.message
          : 'Не удалось собрать короткую сессию',
      );
    } finally {
      setSosLoadingId(null);
    }
  }, []);

  const clearSos = useCallback(() => {
    setSosSession(null);
    setSosErr(null);
  }, []);

  if (!isReady || !isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={styles.title}>Тревожная кнопка</Text>
        <Text style={styles.caption}>Войдите, чтобы пользоваться режимом.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={{ backgroundColor: theme.background, flex: 1 }}
    >
      <Text style={styles.title}>Тревожная кнопка</Text>
      <Text style={styles.disclaimer}>
        Это не экстренная медицинская помощь и не замена терапии. Если вам нужна
        помощь специалиста — обратитесь к врачу или в службу кризисной
        поддержки.
      </Text>
      <Text style={styles.caption}>
        Выберите симптом, который ощущается острее всего прямо сейчас. Мы
        подберём короткую последовательность упражнений (тот же движок MND, что
        и для дневной сессии).
      </Text>

      {sosSession != null ? (
        <View style={styles.sessionBlock}>
          <View style={styles.sessionHeaderRow}>
            <Text style={styles.sectionTitle}>Ваш набор</Text>
            <Pressable
              hitSlop={8}
              onPress={clearSos}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.link}>Другой симптом</Text>
            </Pressable>
          </View>
          <Text style={styles.caption}>
            День (UTC): {sosSession.dayKeyUtc}. Упражнений:{' '}
            {String(sosSession.steps.length)}.
          </Text>
          {sosErr != null ? <Text style={styles.err}>{sosErr}</Text> : null}
          {sosSession.steps.map((step, idx) => (
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
          ))}
          <Text style={styles.mndSummary}>
            Направление в этой мини-сессии: в среднем{' '}
            {String(sosSession.avgBottomUpPercent)}% «снизу вверх» (по матрице
            для выбранного симптома).
          </Text>
        </View>
      ) : (
        <>
          {symptomsLoading ? (
            <View style={styles.row}>
              <ActivityIndicator color={theme.tint} size="small" />
              <Text style={styles.caption}> Загрузка симптомов…</Text>
            </View>
          ) : null}
          {symptomsErr != null ? (
            <Text style={styles.err}>{symptomsErr}</Text>
          ) : null}
          {sosErr != null ? <Text style={styles.err}>{sosErr}</Text> : null}
          {symptoms.map((s) => {
            const busy = sosLoadingId === s.id;
            return (
              <Pressable
                key={s.id}
                disabled={busy}
                style={({ pressed }) => [
                  styles.symptomCard,
                  { opacity: pressed && !busy ? 0.9 : 1 },
                ]}
                onPress={() => {
                  void onPickSymptom(s.id);
                }}
              >
                <View style={styles.symptomTitleRow}>
                  <Text style={styles.symptomTitle}>
                    {pickLocalized(s.title)}
                  </Text>
                  {busy ? (
                    <ActivityIndicator
                      accessibilityLabel="Загрузка"
                      color={theme.tint}
                      size="small"
                    />
                  ) : null}
                </View>
                <Text style={styles.symptomDesc} numberOfLines={4}>
                  {pickLocalized(s.description)}
                </Text>
                <Text style={styles.symptomHint}>Начать сессию →</Text>
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}


function createNowStyles(t: AppTokens) {
  return StyleSheet.create({
    caption: {
      color: t.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 10,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    disclaimer: {
      backgroundColor: t.warningSurface,
      borderColor: t.warningBorder,
      borderRadius: 12,
      borderWidth: 1,
      color: t.warningText,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 14,
      padding: 14,
    },
    err: {
      color: t.error,
      marginBottom: 8,
      fontWeight: '500',
    },
    link: {
      color: t.link,
      fontSize: 15,
      fontWeight: '700',
    },
    mndSummary: {
      color: t.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 10,
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 8,
    },
    sectionTitle: {
      color: t.text,
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    sessionBlock: {
      marginTop: 4,
    },
    sessionHeaderRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    symptomCard: {
      backgroundColor: t.surface,
      borderColor: t.borderSubtle,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 12,
      padding: 16,
    },
    symptomDesc: {
      color: t.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },
    symptomHint: {
      color: t.link,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 10,
    },
    symptomTitle: {
      color: t.text,
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      marginRight: 8,
    },
    symptomTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    title: {
      color: t.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.4,
      marginBottom: 10,
    },
  });
}
