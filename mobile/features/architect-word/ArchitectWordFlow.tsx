import { InlineMediaPlayer } from '@/components/lesson/InlineMediaPlayer';
import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ArchitectWordSlide } from '@/lib/api/types/architect-word.types';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type ArchitectWordFlowProps = {
  slides: ArchitectWordSlide[];
  loading?: boolean;
  submitting?: boolean;
  error?: string | null;
  onFinish: () => void;
  finishLabel?: string;
};

export function ArchitectWordFlow({
  slides,
  loading = false,
  submitting = false,
  error = null,
  onFinish,
  finishLabel = 'Дальше',
}: ArchitectWordFlowProps): React.JSX.Element {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [index, setIndex] = useState(0);

  const slide = slides[index];
  const isLast = slides.length === 0 || index >= slides.length - 1;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} size="large" />
      </View>
    );
  }

  if (slides.length === 0) {
    return (
      <View style={[styles.centered, styles.scroll, { backgroundColor: theme.background }]}>
        <Text style={styles.lead}>Видео для ваших симптомов пока не готовы.</Text>
        <Pressable
          style={[styles.primary, submitting ? styles.primaryDisabled : null]}
          onPress={onFinish}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.tintForeground} />
          ) : (
            <Text style={styles.primaryText}>{finishLabel}</Text>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background, flex: 1 }}
      contentContainerStyle={styles.scroll}
    >
      <Text style={styles.blockTitle}>Слово Архитектора</Text>
      <Text style={styles.lead}>
        Короткое вступление по темам, которые вы выбрали. Слайд {String(index + 1)} из{' '}
        {String(slides.length)}.
      </Text>
      {slide?.symptomTitle ? (
        <Text style={styles.symptomLabel}>{slide.symptomTitle}</Text>
      ) : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {slide ? <InlineMediaPlayer url={slide.mediaUrl} /> : null}
      <View style={styles.actions}>
        <Pressable
          style={[styles.secondary, index === 0 ? styles.secondaryDisabled : null]}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0 || submitting}
        >
          <Text style={styles.secondaryText}>← Назад</Text>
        </Pressable>
        {isLast ? (
          <Pressable
            style={[styles.primary, submitting ? styles.primaryDisabled : null]}
            onPress={onFinish}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={theme.tintForeground} />
            ) : (
              <Text style={styles.primaryText}>{finishLabel}</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={styles.primary}
            onPress={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={submitting}
          >
            <Text style={styles.primaryText}>Следующий слайд</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function createStyles(t: AppTokens) {
  return StyleSheet.create({
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
      marginTop: 20,
    },
    blockTitle: {
      color: t.text,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.3,
      marginBottom: 12,
    },
    centered: { flex: 1, justifyContent: 'center' },
    err: { color: t.error, marginBottom: 8, fontWeight: '500' },
    lead: {
      color: t.textSecondary,
      fontSize: 15,
      lineHeight: 23,
      marginBottom: 12,
    },
    primary: {
      alignItems: 'center',
      backgroundColor: t.tint,
      borderRadius: 14,
      flexGrow: 1,
      minWidth: 160,
      paddingVertical: 14,
    },
    primaryDisabled: { opacity: 0.5 },
    primaryText: { color: t.tintForeground, fontSize: 16, fontWeight: '700' },
    scroll: { padding: 20, paddingBottom: 40 },
    secondary: {
      alignItems: 'center',
      borderColor: t.border,
      borderRadius: 14,
      borderWidth: 1,
      minWidth: 120,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    secondaryDisabled: { opacity: 0.4 },
    secondaryText: { color: t.link, fontSize: 16, fontWeight: '600' },
    symptomLabel: {
      color: t.tint,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
    },
  });
}
