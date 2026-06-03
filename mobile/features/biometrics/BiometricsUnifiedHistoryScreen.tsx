import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import {
  formatRuPoseSessionCapturedAt,
  loadPoseSessionHistoriesNewestFirst,
} from '@/lib/biometrics/pose-session-history.store';
import type { PoseSessionHistoryListItem } from '@/lib/biometrics/types/pose-session-persistence.types';
import type { VoiceSessionHistoryListItem } from '@/lib/biometrics/types/voice-session-persistence.types';
import {
  formatRuVoiceSessionCapturedAt,
  loadVoiceSessionHistoriesNewestFirst,
} from '@/lib/biometrics/voice/voice-session-history.store';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

export type BiometricsHistoryKind = 'pose' | 'voice';

export type BiometricsHistoryListEntry = {
  capturedAtIso: string;
  headline: string;
  kind: BiometricsHistoryKind;
  kindLabel: string;
  quality: string;
  sessionId: string;
  toneBar: string;
};

function resolvePoseToneBar(
  tone: PoseSessionHistoryListItem['tone'],
  theme: ReturnType<typeof useAppTheme>,
): string {
  if (tone === 'positive') {
    return theme.success;
  }
  if (tone === 'attention') {
    return theme.warningBorder;
  }
  return theme.tint;
}

function resolveVoiceToneBar(
  tone: VoiceSessionHistoryListItem['tone'],
  theme: ReturnType<typeof useAppTheme>,
): string {
  if (tone === 'positive') {
    return theme.success;
  }
  if (tone === 'attention') {
    return theme.warningBorder;
  }
  return theme.tint;
}

function mergeHistoriesNewestFirst(
  poseItems: PoseSessionHistoryListItem[],
  voiceItems: VoiceSessionHistoryListItem[],
  theme: ReturnType<typeof useAppTheme>,
): BiometricsHistoryListEntry[] {
  const poseRows: BiometricsHistoryListEntry[] = poseItems.map((item) => ({
    capturedAtIso: item.capturedAtIso,
    headline: item.headline,
    kind: 'pose',
    kindLabel: 'Осанка',
    quality: item.quality,
    sessionId: item.sessionId,
    toneBar: resolvePoseToneBar(item.tone, theme),
  }));
  const voiceRows: BiometricsHistoryListEntry[] = voiceItems.map((item) => ({
    capturedAtIso: item.capturedAtIso,
    headline: item.headline,
    kind: 'voice',
    kindLabel: 'Голос',
    quality: item.quality,
    sessionId: item.sessionId,
    toneBar: resolveVoiceToneBar(item.tone, theme),
  }));
  return [...poseRows, ...voiceRows].sort((a, b) =>
    b.capturedAtIso.localeCompare(a.capturedAtIso),
  );
}

function formatCapturedAt(iso: string, kind: BiometricsHistoryKind): string {
  if (kind === 'pose') {
    return formatRuPoseSessionCapturedAt(iso);
  }
  return formatRuVoiceSessionCapturedAt(iso);
}

export function BiometricsUnifiedHistoryScreen(props: Readonly<{
  emptyHint: string;
  leadCopy: string;
  onBack: () => void;
  onOpenSession: (kind: BiometricsHistoryKind, sessionId: string) => void;
  title: string;
}>): JSX.Element {
  const { emptyHint, leadCopy, onBack, onOpenSession, title } = props;
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const [items, setItems] = useState<BiometricsHistoryListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    void Promise.all([
      loadPoseSessionHistoriesNewestFirst(),
      loadVoiceSessionHistoriesNewestFirst(),
    ])
      .then(([poseItems, voiceItems]) => mergeHistoriesNewestFirst(poseItems, voiceItems, t))
      .then(setItems)
      .finally(() => {
        setLoading(false);
      });
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <ScrollView
      contentContainerStyle={[bf.scroll, { paddingBottom: 32 }]}
      style={{ backgroundColor: t.background, flex: 1 }}
    >
      <Text style={bf.blockTitle}>{title}</Text>
      <Text style={bf.lead}>{leadCopy}</Text>
      <Pressable hitSlop={8} style={bf.secondary} onPress={onBack}>
        <Text style={bf.secondaryText}>← Закрыть</Text>
      </Pressable>
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: 28 }}>
          <ActivityIndicator color={t.tint} size="large" />
        </View>
      ) : null}
      {!loading && items.length === 0 ? (
        <Text style={[bf.lead, { marginTop: 16 }]}>{emptyHint}</Text>
      ) : null}
      {!loading
        ? items.map((item) => (
            <Pressable
              accessibilityRole="button"
              hitSlop={4}
              key={`${item.kind}_${item.sessionId}`}
              onPress={() => {
                onOpenSession(item.kind, item.sessionId);
              }}
            >
              <View
                style={{
                  backgroundColor: t.backgroundMuted,
                  borderBottomWidth: 1,
                  borderColor: t.borderSubtle,
                  borderLeftWidth: 4,
                  borderLeftColor: item.toneBar,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text style={[bf.captureHint, { color: t.textMuted, marginBottom: 4 }]}>
                  {`${formatCapturedAt(item.capturedAtIso, item.kind)} · ${item.kindLabel}`}
                </Text>
                <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', lineHeight: 22 }}>
                  {item.headline}
                </Text>
                <Text style={[bf.captureHint, { marginTop: 6 }]}>
                  {`Статус: ${item.quality}`}
                </Text>
              </View>
            </Pressable>
          ))
        : null}
    </ScrollView>
  );
}
