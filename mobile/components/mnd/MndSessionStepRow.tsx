import type { AppMndSessionStep } from '@/lib/api/types/mnd-session.types';
import { mndStackShortLabelRu } from '@/lib/i18n/mnd-stack-label';
import { pickLocalized } from '@/lib/i18n/pick-localized';
import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  step: AppMndSessionStep;
  index: number;
  onPress: () => void;
};

export function MndSessionStepRow(props: Props): React.JSX.Element {
  const { step, index, onPress } = props;
  const done = step.completed === true;
  const t = useAppTheme();
  const styles = useMemo(() => createMndStepStyles(t), [t]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.mndStep,
        done ? styles.mndStepDone : null,
        { opacity: pressed ? 0.88 : 1 },
      ]}
      onPress={onPress}
    >
      <Text style={styles.mndStepIdx}>{String(index + 1)}.</Text>
      <View style={styles.mndStepBody}>
        <View style={styles.titleRow}>
          <Text style={styles.mndStepTitle}>{pickLocalized(step.title)}</Text>
          {done ? (
            <View
              style={[styles.doneBadge, { backgroundColor: t.successSurface }]}
              accessibilityLabel="Упражнение выполнено"
            >
              <FontAwesome color={t.successMuted} name="check" size={12} />
              <Text style={[styles.doneBadgeText, { color: t.successMuted }]}>
                Выполнено
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.mndStepMeta}>
          {mndStackShortLabelRu(step.masterStackCode)} ·{' '}
          {step.direction === 'bottom_up'
            ? 'сначала тело'
            : 'сначала внимание'}
          {' · '}
          уровень {String(step.complexityLevel)}
        </Text>
        <Text style={styles.mndStepTap}>Открыть →</Text>
      </View>
    </Pressable>
  );
}

function createMndStepStyles(t: AppTokens) {
  return StyleSheet.create({
    doneBadge: {
      alignItems: 'center',
      borderRadius: 999,
      flexDirection: 'row',
      marginLeft: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    doneBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 6,
    },
    mndStep: {
      alignItems: 'flex-start',
      backgroundColor: t.surface,
      borderColor: t.borderSubtle,
      borderRadius: 14,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: 10,
      padding: 14,
    },
    mndStepBody: { flex: 1, minWidth: 0 },
    mndStepDone: {
      backgroundColor: t.successSurface,
      borderColor: t.successMuted,
    },
    mndStepIdx: {
      color: t.tint,
      fontSize: 16,
      fontWeight: '800',
      marginRight: 10,
      paddingTop: 2,
    },
    mndStepMeta: {
      color: t.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
    mndStepTap: {
      color: t.link,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 10,
    },
    mndStepTitle: {
      color: t.text,
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      minWidth: 0,
    },
    titleRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
}
