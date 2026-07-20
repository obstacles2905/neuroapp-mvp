import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import type {
  FaceExpressionProductMetrics,
  FaceMetricBand,
  FaceSessionInterpretation,
} from '@/lib/biometrics/types/face-measurement.types';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { JSX } from 'react';
import { Text, View } from 'react-native';

type FaceCoreMetricsSummaryProps = Readonly<{
  interpretation?: FaceSessionInterpretation | undefined;
  metrics: FaceExpressionProductMetrics;
}>;

function bandAccent(
  level: FaceMetricBand['level'],
  higherIsBetter: boolean,
  theme: ReturnType<typeof useAppTheme>,
): string {
  if (level === 'mid') {
    return theme.text;
  }
  const favorable =
    (higherIsBetter && level === 'high') || (!higherIsBetter && level === 'low');
  return favorable ? theme.tint : theme.warningText;
}

function metricRow(
  title: string,
  band: FaceMetricBand | null,
  fallbackScore: number,
  fallbackHint: string,
  higherIsBetter: boolean,
  bf: ReturnType<typeof useBiometricFlowStyles>,
  theme: ReturnType<typeof useAppTheme>,
): JSX.Element {
  const label = band?.label ?? `${Math.round(fallbackScore)}`;
  const meaning = band?.meaning ?? fallbackHint;
  const score = band?.score ?? fallbackScore;
  const accent =
    band != null ? bandAccent(band.level, higherIsBetter, theme) : theme.text;

  return (
    <View
      key={title}
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        padding: 14,
      }}
    >
      <Text style={[bf.blockTitle, { fontSize: 16 }]}>{title}</Text>
      <Text
        style={{
          color: accent,
          fontSize: 22,
          fontWeight: '700',
          marginTop: 6,
        }}
      >
        {label}
      </Text>
      <Text style={[bf.lead, { marginTop: 6 }]}>{meaning}</Text>
      <Text style={[bf.lead, { fontSize: 13, marginTop: 8, opacity: 0.7 }]}>
        Технический индекс: {Math.round(score)}
      </Text>
    </View>
  );
}

export function FaceCoreMetricsSummary({
  interpretation,
  metrics,
}: FaceCoreMetricsSummaryProps): JSX.Element {
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();

  return (
    <View>
      {metricRow(
        'Выразительность мимики',
        interpretation?.expressiveness ?? null,
        metrics.expressivenessScore,
        'Насколько лицо меняется между спокойным состоянием и выражениями по инструкции.',
        true,
        bf,
        t,
      )}
      {metricRow(
        'Напряжение челюсти в покое',
        interpretation?.facialTension ?? null,
        metrics.facialTensionScore,
        'Оценка зажима рта и челюсти на нейтральном кадре.',
        false,
        bf,
        t,
      )}
      {metricRow(
        'Асимметрия мимики',
        interpretation?.asymmetry ?? null,
        metrics.asymmetryScore,
        'Разница между левой и правой стороной лица по ключевым мышечным сигналам.',
        false,
        bf,
        t,
      )}
    </View>
  );
}
