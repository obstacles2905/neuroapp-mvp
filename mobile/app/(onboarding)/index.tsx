import {
  onboardingBiometricCopy,
  onboardingSubscriptionStubCopy,
  onboardingValuePitchCopy,
} from '@/constants/onboarding-flow.copy';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import {
  fetchOnboardingSymptoms,
  skipOnboarding,
  submitOnboarding,
} from '@/lib/api/app-onboarding';
import type { AppSymptomListItem } from '@/lib/api/types/onboarding.types';
import type { AppTokens } from '@/constants/theme';
import { pickLocalized } from '@/lib/i18n/pick-localized';
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

import { PostureBurstCapture } from '@/features/biometrics/PostureBurstCapture';
import { useAppTheme } from '@/hooks/useAppTheme';

const MAX_SELECTED = 5;

type OnboardingPhase =
  | 'biometric_intro'
  | 'biometric_m1_about'
  | 'biometric_m1_action'
  | 'biometric_m2_about'
  | 'biometric_m2_action'
  | 'symptoms_select'
  | 'symptoms_rank'
  | 'value_proposition'
  | 'subscription_stub';

function toggleSelection(
  id: string,
  selected: string[],
  max: number,
): string[] {
  const idx = selected.indexOf(id);
  if (idx >= 0) {
    return selected.filter((x) => x !== id);
  }
  if (selected.length >= max) {
    return selected;
  }
  return [...selected, id];
}

function moveItem(ids: string[], index: number, dir: -1 | 1): string[] {
  const j = index + dir;
  if (j < 0 || j >= ids.length) {
    return ids;
  }
  const next = [...ids];
  const t = next[index]!;
  next[index] = next[j]!;
  next[j] = t;
  return next;
}

export default function OnboardingScreen(): React.JSX.Element {
  const t = useAppTheme();
  const styles = useMemo(() => createOnboardingStyles(t), [t]);
  const { refreshUser, user } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<OnboardingPhase>('biometric_intro');
  const [symptoms, setSymptoms] = useState<AppSymptomListItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rankedIds, setRankedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLeaveToApp =
    user != null &&
    !user.needsOnboarding &&
    user.onboardingCompletedAt == null;

  const symptomById = useMemo(() => {
    const m = new Map<string, AppSymptomListItem>();
    for (const s of symptoms) {
      m.set(s.id, s);
    }
    return m;
  }, [symptoms]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchOnboardingSymptoms();
        if (!cancelled) {
          setSymptoms(list);
        }
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить симптомы.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const skipBiometricBlock = useCallback(() => {
    setPhase('symptoms_select');
    setError(null);
  }, []);

  const onToggleCategory = useCallback((id: string) => {
    setSelectedIds((prev) => toggleSelection(id, prev, MAX_SELECTED));
  }, []);

  const onContinueToOrder = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }
    setRankedIds([...selectedIds]);
    setPhase('symptoms_rank');
    setError(null);
  }, [selectedIds]);

  const onBackToSymptomPick = useCallback(() => {
    setPhase('symptoms_select');
    setError(null);
  }, []);

  async function onSubmitSymptoms(): Promise<void> {
    if (rankedIds.length === 0) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitOnboarding(rankedIds);
      await refreshUser();
      setPhase('value_proposition');
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'Не удалось сохранить. Повторите.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSkipFullOnboarding(): Promise<void> {
    setError(null);
    setSubmitting(true);
    try {
      await skipOnboarding();
      await refreshUser();
      router.replace('/(app)/(tabs)' as Href);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'Не удалось пропустить. Повторите.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function finishOnboardingToApp(): void {
    router.replace('/(app)/(tabs)' as Href);
  }

  if (loading && phase.startsWith('symptoms')) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator color={t.tint} size="large" />
      </View>
    );
  }

  if (phase === 'biometric_intro') {
    return (
      <ScrollView style={{ backgroundColor: t.background, flex: 1 }} contentContainerStyle={styles.scroll}>
        {canLeaveToApp ? (
          <Pressable
            style={styles.ghostTop}
            onPress={() => {
              router.replace('/(app)/(tabs)/profile' as Href);
            }}
          >
            <Text style={styles.ghostTopText}>
              ← Вернуться в профиль без изменений
            </Text>
          </Pressable>
        ) : null}
        <Text style={styles.blockTitle}>Стартовые замеры</Text>
        <Text style={styles.lead}>{onboardingBiometricCopy.introLead}</Text>
        <Text style={styles.lead}>{onboardingBiometricCopy.introPointA}</Text>
        <Text style={styles.privacyBox}>{onboardingBiometricCopy.privacyNote}</Text>
        <Pressable
          style={styles.primary}
          onPress={() => {
            setPhase('biometric_m1_about');
            setError(null);
          }}
        >
          <Text style={styles.primaryText}>Пройти замеры</Text>
        </Pressable>
        <Pressable style={styles.ghost} onPress={skipBiometricBlock}>
          <Text style={styles.ghostText}>Пропустить, перейти к симптомам</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'biometric_m1_about') {
    return (
      <ScrollView style={{ backgroundColor: t.background, flex: 1 }} contentContainerStyle={styles.scroll}>
        <Text style={styles.blockTitle}>{onboardingBiometricCopy.m1Title}</Text>
        <Text style={styles.lead}>{onboardingBiometricCopy.m1About}</Text>
        <Pressable
          style={styles.primary}
          onPress={() => setPhase('biometric_m1_action')}
        >
          <Text style={styles.primaryText}>Дальше</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => setPhase('biometric_intro')}
        >
          <Text style={styles.secondaryText}>← Назад</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'biometric_m1_action') {
    return (
      <ScrollView style={{ backgroundColor: t.background, flex: 1 }} contentContainerStyle={styles.scroll}>
        <Text style={styles.blockTitle}>{onboardingBiometricCopy.m1Title}</Text>
        <Text style={styles.instructionBox}>
          {onboardingBiometricCopy.m1Instruction}
        </Text>
        <View style={styles.mockBioArea}>
          <Text style={styles.mockBioHint}>
            Место для модуля камеры / ППГ (появится в био-обновлении)
          </Text>
        </View>
        <Pressable
          style={styles.primary}
          onPress={() => setPhase('biometric_m2_about')}
        >
          <Text style={styles.primaryText}>Готово — к замеру 2</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => setPhase('biometric_m1_about')}
        >
          <Text style={styles.secondaryText}>← Назад</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'biometric_m2_about') {
    return (
      <ScrollView style={{ backgroundColor: t.background, flex: 1 }} contentContainerStyle={styles.scroll}>
        <Text style={styles.blockTitle}>{onboardingBiometricCopy.m2Title}</Text>
        <Text style={styles.lead}>{onboardingBiometricCopy.m2About}</Text>
        <Pressable
          style={styles.primary}
          onPress={() => setPhase('biometric_m2_action')}
        >
          <Text style={styles.primaryText}>Дальше</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => setPhase('biometric_m1_action')}
        >
          <Text style={styles.secondaryText}>← Назад</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'biometric_m2_action') {
    return (
      <PostureBurstCapture
        screenTitle={onboardingBiometricCopy.m2Title}
        onBack={() => setPhase('biometric_m2_about')}
        onComplete={() => {
          setPhase('symptoms_select');
          setError(null);
        }}
      />
    );
  }

  if (phase === 'value_proposition') {
    return (
      <ScrollView style={{ backgroundColor: t.background, flex: 1 }} contentContainerStyle={styles.scroll}>
        <Text style={styles.blockTitle}>{onboardingValuePitchCopy.title}</Text>
        <Text style={styles.lead}>{onboardingValuePitchCopy.body}</Text>
        <Text style={styles.leadMuted}>{onboardingValuePitchCopy.foot}</Text>
        <Pressable
          style={styles.primary}
          onPress={() => setPhase('subscription_stub')}
        >
          <Text style={styles.primaryText}>Дальше</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'subscription_stub') {
    return (
      <ScrollView style={{ backgroundColor: t.background, flex: 1 }} contentContainerStyle={styles.scroll}>
        <Text style={styles.blockTitle}>
          {onboardingSubscriptionStubCopy.title}
        </Text>
        <Text style={styles.lead}>{onboardingSubscriptionStubCopy.lead}</Text>
        <View style={styles.stubCard}>
          <Text style={styles.stubTier}>{onboardingSubscriptionStubCopy.tierName}</Text>
          <Text style={styles.stubHint}>{onboardingSubscriptionStubCopy.tierHint}</Text>
        </View>
        <Pressable style={[styles.primary, styles.primaryMuted]} disabled>
          <Text style={styles.primaryTextMuted}>
            {onboardingSubscriptionStubCopy.ctaPaid}
          </Text>
        </Pressable>
        <Pressable style={styles.primary} onPress={finishOnboardingToApp}>
          <Text style={styles.primaryText}>
            {onboardingSubscriptionStubCopy.ctaFree}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.background }]}>
        <ActivityIndicator color={t.tint} size="large" />
      </View>
    );
  }

  if (phase === 'symptoms_select') {
    return (
      <ScrollView style={{ backgroundColor: t.background, flex: 1 }} contentContainerStyle={styles.scroll}>
        {canLeaveToApp ? (
          <Pressable
            style={styles.ghostTop}
            onPress={() => {
              router.replace('/(app)/(tabs)/profile' as Href);
            }}
            disabled={submitting}
          >
            <Text style={styles.ghostTopText}>
              ← Вернуться в профиль без изменений
            </Text>
          </Pressable>
        ) : null}
        <Text style={styles.lead}>
          Выберите от 1 до {String(MAX_SELECTED)} симптомов, которые для вас сейчас
          узнаваемы (можно меньше пяти). Ниже — коротко «в чём суть».
        </Text>
        <Text style={styles.hint}>
          Выбрано: {String(selectedIds.length)}/{String(MAX_SELECTED)}
        </Text>
        {selectedIds.length >= MAX_SELECTED ? (
          <Text style={styles.warn}>
            Чтобы выбрать другой симптом, снимите выделение с одного из выбранных.
          </Text>
        ) : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}
        {symptoms.map((s) => {
          const on = selectedIds.includes(s.id);
          const essence = pickLocalized(s.description);
          return (
            <Pressable
              key={s.id}
              onPress={() => onToggleCategory(s.id)}
              style={[styles.chip, on ? styles.chipOn : null]}
            >
              <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>
                {pickLocalized(s.title)}
              </Text>
              {essence.length > 0 ? (
                <Text style={[styles.chipSub, on ? styles.chipSubOn : null]}>
                  {essence}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
        <Pressable
          style={[
            styles.primary,
            selectedIds.length === 0 || submitting
              ? styles.primaryDisabled
              : null,
          ]}
          onPress={onContinueToOrder}
          disabled={selectedIds.length === 0 || submitting}
        >
          <Text style={styles.primaryText}>Далее: расставить по важности</Text>
        </Pressable>
        {canLeaveToApp ? null : (
          <>
            <Pressable
              style={styles.ghost}
              onPress={onSkipFullOnboarding}
              disabled={submitting}
              accessibilityLabel="Пропустить настройку приоритетов"
            >
              {submitting ? (
                <ActivityIndicator color={t.tint} />
              ) : (
                <Text style={styles.ghostText}>Пока пропустить, решу позже</Text>
              )}
            </Pressable>
            <Text style={styles.ghostHint}>
              Настроить приоритеты можно позже в разделе «Профиль».
            </Text>
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: t.background, flex: 1 }} contentContainerStyle={styles.scroll}>
      {canLeaveToApp ? (
        <Pressable
          style={styles.ghostTop}
          onPress={() => {
            router.replace('/(app)/(tabs)/profile' as Href);
          }}
          disabled={submitting}
        >
          <Text style={styles.ghostTopText}>
            ← Вернуться в профиль без изменений
          </Text>
        </Pressable>
      ) : null}
      <Text style={styles.lead}>
        Расставьте выбранные симптомы: выше — важнее. Позиция 1 — самая значимая
        для вас, {String(rankedIds.length)} — наименее значимая среди выбранных.
      </Text>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {rankedIds.map((id, i) => {
        const row = symptomById.get(id);
        const title = row ? pickLocalized(row.title) : id;
        const essence = row ? pickLocalized(row.description) : '';
        return (
          <View key={id} style={styles.rankCard}>
            <Text style={styles.rankBadge}>{String(i + 1)}</Text>
            <View style={styles.rankTextCol}>
              <Text style={styles.rankTitle}>{title}</Text>
              {essence.length > 0 ? (
                <Text style={styles.rankEssence}>{essence}</Text>
              ) : null}
            </View>
            <View style={styles.rankActionsWrap}>
              <View style={styles.rankActions}>
                <Pressable
                  onPress={() => setRankedIds((r) => moveItem(r, i, -1))}
                  disabled={i === 0}
                  style={[styles.iconBtn, i === 0 ? styles.iconBtnOff : null]}
                  accessibilityLabel="Выше"
                >
                  <Text style={styles.iconBtnTxt}>↑</Text>
                </Pressable>
                <Pressable
                  onPress={() => setRankedIds((r) => moveItem(r, i, 1))}
                  disabled={i === rankedIds.length - 1}
                  style={[
                    styles.iconBtn,
                    i === rankedIds.length - 1 ? styles.iconBtnOff : null,
                  ]}
                  accessibilityLabel="Ниже"
                >
                  <Text style={styles.iconBtnTxt}>↓</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}
      <Pressable
        onPress={onBackToSymptomPick}
        style={styles.secondary}
        disabled={submitting}
      >
        <Text style={styles.secondaryText}>← Назад к выбору</Text>
      </Pressable>
      <Pressable
        style={[styles.primary, submitting ? styles.primaryDisabled : null]}
        onPress={onSubmitSymptoms}
        disabled={submitting || rankedIds.length === 0}
        accessibilityLabel="Готово"
      >
        {submitting ? (
          <ActivityIndicator color={t.tintForeground} />
        ) : (
          <Text style={styles.primaryText}>Сохранить и продолжить</Text>
        )}
      </Pressable>
      {canLeaveToApp ? null : (
        <Pressable
          style={styles.ghost}
          onPress={onSkipFullOnboarding}
          disabled={submitting}
          accessibilityLabel="Пропустить"
        >
          {submitting ? (
            <ActivityIndicator color={t.tint} />
          ) : (
            <Text style={styles.ghostText}>Пока пропустить, решу позже</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

function createOnboardingStyles(t: AppTokens) {
  return StyleSheet.create({
    blockTitle: {
      color: t.text,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.3,
      marginBottom: 12,
    },
    centered: { flex: 1, justifyContent: 'center' },
    chip: {
      backgroundColor: t.surfaceHover,
      borderColor: t.border,
      borderRadius: 14,
      borderWidth: 1,
      marginTop: 10,
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    chipOn: { backgroundColor: t.tintMuted, borderColor: t.tint },
    chipText: { color: t.text, fontSize: 16 },
    chipTextOn: { fontWeight: '700' },
    chipSub: {
      color: t.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },
    chipSubOn: { color: t.link },
    err: { color: t.error, marginBottom: 8, fontWeight: '500' },
    ghost: { alignSelf: 'center', marginTop: 16, paddingVertical: 10 },
    ghostHint: {
      color: t.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 8,
      textAlign: 'center',
    },
    ghostText: { color: t.textSecondary, fontSize: 16, textAlign: 'center' },
    ghostTop: { alignSelf: 'flex-start', marginBottom: 12 },
    ghostTopText: { color: t.link, fontSize: 15, fontWeight: '600' },
    hint: { color: t.textSecondary, fontSize: 14, marginTop: 6, fontWeight: '600' },
    iconBtn: {
      backgroundColor: t.backgroundMuted,
      borderRadius: 10,
      minWidth: 44,
      paddingVertical: 8,
    },
    iconBtnOff: { opacity: 0.35 },
    iconBtnTxt: {
      color: t.text,
      fontSize: 17,
      textAlign: 'center',
      fontWeight: '600',
    },
    instructionBox: {
      backgroundColor: t.backgroundMuted,
      borderRadius: 12,
      color: t.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
      overflow: 'hidden',
      padding: 16,
    },
    lead: {
      color: t.textSecondary,
      fontSize: 15,
      lineHeight: 23,
      marginBottom: 10,
    },
    leadMuted: {
      color: t.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
    },
    mockBioArea: {
      alignItems: 'center',
      backgroundColor: t.backgroundMuted,
      borderColor: t.border,
      borderRadius: 16,
      borderStyle: 'dashed',
      borderWidth: 1,
      justifyContent: 'center',
      marginVertical: 16,
      minHeight: 140,
      padding: 16,
    },
    mockBioHint: {
      color: t.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    primary: {
      alignItems: 'center',
      alignSelf: 'stretch',
      backgroundColor: t.tint,
      borderRadius: 14,
      marginTop: 24,
      paddingVertical: 16,
    },
    primaryDisabled: { opacity: 0.5 },
    primaryMuted: {
      alignSelf: 'stretch',
      backgroundColor: t.textMuted,
      marginBottom: 12,
      marginTop: 16,
      paddingVertical: 16,
    },
    primaryTextMuted: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },
    primaryText: { color: t.tintForeground, fontSize: 17, fontWeight: '700' },
    privacyBox: {
      backgroundColor: t.warningSurface,
      borderColor: t.warningBorder,
      borderRadius: 12,
      borderWidth: 1,
      color: t.warningText,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 12,
      padding: 14,
    },
    rankActions: { flexDirection: 'row', columnGap: 8 },
    rankActionsWrap: { alignSelf: 'stretch', justifyContent: 'center' },
    rankBadge: {
      color: t.tint,
      fontSize: 16,
      fontWeight: '800',
      marginRight: 10,
      minWidth: 22,
      paddingTop: 2,
    },
    rankCard: {
      alignItems: 'flex-start',
      backgroundColor: t.surface,
      borderColor: t.borderSubtle,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      marginTop: 10,
      padding: 14,
    },
    rankEssence: {
      color: t.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 6,
    },
    rankTextCol: { flex: 1, marginRight: 8, minWidth: 0 },
    rankTitle: { color: t.text, fontSize: 16, fontWeight: '700' },
    scroll: { padding: 20, paddingBottom: 40 },
    secondary: { alignSelf: 'flex-start', marginTop: 16, paddingVertical: 8 },
    secondaryText: { color: t.link, fontSize: 16, fontWeight: '600' },
    stubCard: {
      backgroundColor: t.surface,
      borderColor: t.border,
      borderRadius: 14,
      borderWidth: 1,
      marginTop: 12,
      padding: 18,
    },
    stubHint: {
      color: t.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
    },
    stubTier: { color: t.text, fontSize: 18, fontWeight: '800' },
    warn: {
      color: t.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 8,
      fontWeight: '500',
    },
  });
}
