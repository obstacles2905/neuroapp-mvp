import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import { VoiceCoreMetricsSummary } from '@/features/biometrics/VoiceCoreMetricsSummary';
import {
  formatRuVoiceSessionCapturedAt,
  loadPersistedVoiceSession,
  loadVoiceSessionHistoriesNewestFirst,
} from '@/lib/biometrics/voice/voice-session-history.store';
import type {
  PersistedVoiceSessionRecord,
  VoiceSessionHistoryListItem,
} from '@/lib/biometrics/types/voice-session-persistence.types';
import type { VoiceInterpretationTone } from '@/lib/biometrics/types/voice-measurement.types';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

function ToneBar(props: Readonly<{
  headline: string;
  item: VoiceSessionHistoryListItem;
  toneBar: string;
}>): JSX.Element {
  const { headline, item, toneBar } = props;
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  return (
    <View
      style={{
        backgroundColor: t.backgroundMuted,
        borderBottomWidth: 1,
        borderColor: t.borderSubtle,
        borderLeftWidth: 4,
        borderLeftColor: toneBar,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <Text style={[bf.captureHint, { color: t.textMuted, marginBottom: 4 }]}>
        {formatRuVoiceSessionCapturedAt(item.capturedAtIso)}
      </Text>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', lineHeight: 22 }}>
        {headline}
      </Text>
      <Text style={[bf.captureHint, { marginTop: 6 }]}>
        {`Качество: ${item.quality}`}
      </Text>
    </View>
  );
}

function resolveToneBar(tone: VoiceInterpretationTone, theme: ReturnType<typeof useAppTheme>): string {
  if (tone === 'positive') {
    return theme.success;
  }
  if (tone === 'attention') {
    return theme.warningBorder;
  }
  return theme.tint;
}

export function VoiceHistoryListScreen(props: Readonly<{
  emptyHint: string;
  leadCopy: string;
  onBack: () => void;
  onOpenSession: (sessionId: string) => void;
  title: string;
}>): JSX.Element {
  const { emptyHint, leadCopy, onBack, onOpenSession, title } = props;
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const [items, setItems] = useState<VoiceSessionHistoryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    void loadVoiceSessionHistoriesNewestFirst()
      .then(setItems)
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
              key={item.sessionId}
              onPress={() => {
                onOpenSession(item.sessionId);
              }}
            >
              <ToneBar
                headline={item.headline}
                item={item}
                toneBar={resolveToneBar(item.tone, t)}
              />
            </Pressable>
          ))
        : null}
    </ScrollView>
  );
}

export function VoiceHistoryDetailScreen(props: Readonly<{
  onBack: () => void;
  sessionId: string;
}>): JSX.Element {
  const { onBack, sessionId } = props;
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const [record, setRecord] = useState<PersistedVoiceSessionRecord | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setRecord(undefined);
    void loadPersistedVoiceSession(sessionId).then((loaded) => {
      if (!alive) {
        return;
      }
      setRecord(loaded);
    });
    return () => {
      alive = false;
    };
  }, [sessionId]);

  if (record === undefined) {
    return (
      <View style={[bf.captureScreen, { justifyContent: 'center' }]}>
        <ActivityIndicator color={t.tint} size="large" />
      </View>
    );
  }

  if (record === null) {
    return (
      <ScrollView contentContainerStyle={bf.scroll} style={{ backgroundColor: t.background, flex: 1 }}>
        <Pressable hitSlop={8} style={bf.ghostTop} onPress={onBack}>
          <Text style={bf.ghostTopText}>← Назад</Text>
        </Pressable>
        <Text style={bf.blockTitle}>Запись не найдена</Text>
      </ScrollView>
    );
  }

  const r = record.result;

  return (
    <ScrollView
      contentContainerStyle={[bf.scroll, { paddingBottom: 48 }]}
      style={{ backgroundColor: t.background, flex: 1 }}
    >
      <Pressable hitSlop={8} style={bf.ghostTop} onPress={onBack}>
        <Text style={bf.ghostTopText}>← Назад</Text>
      </Pressable>
      <Text style={bf.blockTitle}>Голос · детали</Text>
      <Text style={[bf.captureHint, { marginBottom: 12 }]}>
        {formatRuVoiceSessionCapturedAt(r.capturedAt)}
      </Text>
      {r.interpretation ? (
        <View style={bf.interpretationPanel}>
          <Text style={bf.interpretationHeadline}>{r.interpretation.headline}</Text>
          {r.interpretation.bullets.map((line) => (
            <Text key={line} style={bf.interpretationBullet}>
              • {line}
            </Text>
          ))}
          <Text style={bf.interpretationDisclaimer}>{r.interpretation.disclaimerLine}</Text>
        </View>
      ) : null}
      <VoiceCoreMetricsSummary session={r} />
    </ScrollView>
  );
}
