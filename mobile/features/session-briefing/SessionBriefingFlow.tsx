import { InlineMediaPlayer } from '@/components/lesson/InlineMediaPlayer';
import type { AppTokens } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { SessionBriefingSlide } from '@/lib/api/types/session-briefing.types';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type SessionBriefingFlowProps = {
  title: string;
  description: string;
  emptyMessage: string;
  slide: SessionBriefingSlide | null;
  loading?: boolean;
  submitting?: boolean;
  error?: string | null;
  onFinish: () => void;
  finishLabel?: string;
};

export function SessionBriefingFlow({
  title,
  description,
  emptyMessage,
  slide,
  loading = false,
  submitting = false,
  error = null,
  onFinish,
  finishLabel = 'Дальше',
}: SessionBriefingFlowProps): React.JSX.Element {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.tint} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background, flex: 1 }}
      contentContainerStyle={styles.scroll}
    >
      <Text style={styles.blockTitle}>{title}</Text>
      <Text style={styles.lead}>{description}</Text>
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {slide ? (
        <InlineMediaPlayer url={slide.mediaUrl} />
      ) : (
        <Text style={styles.empty}>{emptyMessage}</Text>
      )}
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
    </ScrollView>
  );
}

function createStyles(theme: AppTokens) {
  return StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    scroll: {
      padding: 24,
      paddingBottom: 48,
      gap: 16,
    },
    blockTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
    },
    lead: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.textMuted,
    },
    empty: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.textMuted,
      paddingVertical: 8,
    },
    err: {
      color: theme.destructive,
      fontSize: 14,
    },
    primary: {
      marginTop: 8,
      backgroundColor: theme.tint,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryDisabled: {
      opacity: 0.6,
    },
    primaryText: {
      color: theme.tintForeground,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
