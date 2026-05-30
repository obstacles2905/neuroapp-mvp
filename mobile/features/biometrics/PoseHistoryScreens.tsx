import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import { PoseSessionSummaryContent } from '@/features/biometrics/PoseSessionSummaryContent';
import {
  formatRuPoseSessionCapturedAt,
  loadPersistedPoseSession,
  loadPoseSessionHistoriesNewestFirst,
} from '@/lib/biometrics/pose-session-history.store';
import {
  isDualPosePersistRecord,
  type PersistedPoseSessionRecord,
  type PoseSessionHistoryListItem,
} from '@/lib/biometrics/types/pose-session-persistence.types';
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

function ToneBar({
  headline,
  item,
  toneBar,
}: Readonly<{ headline: string; item: PoseSessionHistoryListItem; toneBar: string }>): JSX.Element {
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
        {formatRuPoseSessionCapturedAt(item.capturedAtIso)}
      </Text>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '600', lineHeight: 22 }}>
        {headline}
      </Text>
      <Text style={[bf.captureHint, { marginTop: 6 }]}>
        {`Статус: ${item.quality}`}
      </Text>
    </View>
  );
}

function resolveToneBar(tone: PoseSessionHistoryListItem['tone'], t: ReturnType<typeof useAppTheme>): string {
  if (tone === 'positive') {
    return t.success;
  }
  if (tone === 'attention') {
    return t.warningBorder;
  }
  return t.tint;
}

export function PoseHistoryListScreen(props: {
  emptyHint: string;
  leadCopy: string;
  onBack: () => void;
  onOpenSession: (sessionId: string) => void;
  title: string;
}): JSX.Element {
  const { emptyHint, leadCopy, onBack, onOpenSession, title } = props;
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const [items, setItems] = useState<PoseSessionHistoryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    void loadPoseSessionHistoriesNewestFirst()
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
              <ToneBar headline={item.headline} item={item} toneBar={resolveToneBar(item.tone, t)} />
            </Pressable>
          ))
        : null}
    </ScrollView>
  );
}

export function PoseHistoryDetailScreen(props: { onBack: () => void; sessionId: string }): JSX.Element {
  const { onBack, sessionId } = props;
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const [record, setRecord] = useState<PersistedPoseSessionRecord | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setRecord(undefined);
    void loadPersistedPoseSession(sessionId).then((loaded) => {
      if (!alive) {
        return;
      }
      setRecord(loaded ?? null);
    });
    return () => {
      alive = false;
    };
  }, [sessionId]);

  if (record === undefined) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: t.background,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={t.tint} size="large" />
      </View>
    );
  }

  if (record == null) {
    return (
      <ScrollView contentContainerStyle={bf.scroll} style={{ backgroundColor: t.background, flex: 1 }}>
        <Text style={bf.captureTitle}>Запись не найдена</Text>
        <Pressable style={bf.secondary} onPress={onBack}>
          <Text style={bf.secondaryText}>← К списку</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (isDualPosePersistRecord(record)) {
    return (
      <ScrollView
        contentContainerStyle={[bf.scroll, { paddingBottom: 32 }]}
        style={{ backgroundColor: t.background, flex: 1 }}
      >
        <Text style={bf.captureHint}>
          {`${formatRuPoseSessionCapturedAt(record.result.frontal.observation.capturedAt)} · сохранено ${formatRuPoseSessionCapturedAt(record.persistedAtIso)}`}
        </Text>
        <PoseSessionSummaryContent
          dual={record.result}
          footer={
            <Pressable style={bf.primary} onPress={onBack}>
              <Text style={bf.primaryText}>Назад к списку</Text>
            </Pressable>
          }
          lead="Снимок данных на момент сохранения. Эталоны и формулы — в приложении-бандле."
          title="Запись замера"
        />
      </ScrollView>
    );
  }

  const toneBar =
    record.interpretation.tone === 'positive'
      ? t.success
      : record.interpretation.tone === 'attention'
        ? t.warningBorder
        : t.tint;

  const captAt = record.result.observation.capturedAt;

  return (
    <ScrollView
      contentContainerStyle={[bf.scroll, { paddingBottom: 32 }]}
      style={{ backgroundColor: t.background, flex: 1 }}
    >
      <Text style={bf.captureHint}>
        {`${formatRuPoseSessionCapturedAt(captAt)} · сохранено ${formatRuPoseSessionCapturedAt(record.persistedAtIso)} · архив`}
      </Text>
      <Text style={bf.blockTitle}>Формат до двух ракурсов</Text>
      <Text style={bf.lead}>
        Старая запись без числового отчёта по точкам; ниже сохранённые тогда текст и агрегаты.
      </Text>
      <View
        style={[
          bf.interpretationPanel,
          { borderLeftColor: toneBar, borderLeftWidth: 4 },
        ]}
      >
        <Text style={bf.interpretationHeadline}>{record.interpretation.headline}</Text>
        {record.interpretation.bullets.map((line, idx) => (
          <Text key={`leg_${String(idx)}`} style={bf.interpretationBullet}>
            {`• ${line}`}
          </Text>
        ))}
        <Text style={bf.interpretationDisclaimer}>{record.interpretation.disclaimerLine}</Text>
      </View>
      <Text style={[bf.blockTitle, { marginTop: 20 }]}>Технич. поля тогда</Text>
      <View style={bf.summaryBox}>
        <Text style={bf.summaryLabel}>Качество min visibility</Text>
        <Text style={bf.summaryValue}>
          {record.result.metrics.frameQualityScore != null
            ? record.result.metrics.frameQualityScore.toFixed(2)
            : '—'}
        </Text>
        <Text style={bf.summaryLabel}>Наклон головы (условн.) °</Text>
        <Text style={bf.summaryValue}>
          {record.result.metrics.headTiltDeg != null
            ? record.result.metrics.headTiltDeg.toFixed(1)
            : '—'}
        </Text>
        <Text style={bf.summaryLabel}>Наклон плеч °</Text>
        <Text style={bf.summaryValue}>
          {record.result.metrics.shoulderLineTiltDeg != null
            ? record.result.metrics.shoulderLineTiltDeg.toFixed(1)
            : '—'}
        </Text>
        <Text style={bf.summaryLabel}>Перекос плеч proxy</Text>
        <Text style={bf.summaryValue}>
          {record.result.metrics.shoulderAsymmetryProxy != null
            ? record.result.metrics.shoulderAsymmetryProxy.toFixed(1)
            : '—'}
        </Text>
        <Text style={bf.summaryLabel}>Статус</Text>
        <Text style={bf.summaryValue}>{record.result.quality}</Text>
      </View>
      <Pressable style={bf.primary} onPress={onBack}>
        <Text style={bf.primaryText}>Назад к списку</Text>
      </Pressable>
    </ScrollView>
  );
}
