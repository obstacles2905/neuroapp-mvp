import { PoseSessionVisualization } from '@/features/biometrics/PoseSessionVisualization';
import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import type {
  PoseDualViewSessionResult,
  PoseNumericMetricRow,
} from '@/lib/biometrics/types/pose-measurement.types';
import { type ReactNode, type JSX } from 'react';
import { Text, View } from 'react-native';

function formatDeviation(d: number): string {
  if (Object.is(d, -0)) {
    return '0';
  }
  const sign = d > 0 ? '+' : '';
  return `${sign}${String(d)}`;
}

function MetricLine({ row, bf }: Readonly<{ bf: ReturnType<typeof useBiometricFlowStyles>; row: PoseNumericMetricRow }>): JSX.Element {
  const unit = row.unit != null ? ` ${row.unit}` : '';
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={bf.summaryLabel}>{row.label}</Text>
      <Text style={bf.summaryValue}>
        {`${String(row.value)}${unit} · идеал ${String(row.ideal)}${unit} · отклонение ${formatDeviation(row.deviation)}${unit}`}
      </Text>
    </View>
  );
}

function Block({
  bf,
  rows,
  subtitle,
}: Readonly<{
  bf: ReturnType<typeof useBiometricFlowStyles>;
  rows: PoseNumericMetricRow[];
  subtitle: string;
}>): JSX.Element {
  return (
    <View style={[bf.summaryBox, { marginTop: 12 }]}>
      <Text style={bf.captureTitle}>{subtitle}</Text>
      {rows.length === 0 ? (
        <Text style={bf.summaryValue}>Нет числовых строк (пайплайн или отсутствие точек).</Text>
      ) : (
        rows.map((row) => <MetricLine key={`${row.viewKind}_${row.code}`} bf={bf} row={row} />)
      )}
    </View>
  );
}

export type PoseSessionSummaryContentProps = {
  dual: PoseDualViewSessionResult;
  footer?: ReactNode | undefined;
  lead: string;
  title: string;
};

export function PoseSessionSummaryContent({
  dual,
  footer,
  lead,
  title,
}: PoseSessionSummaryContentProps): JSX.Element {
  const bf = useBiometricFlowStyles();

  return (
    <>
      <Text style={bf.blockTitle}>{title}</Text>
      <Text style={bf.lead}>{lead}</Text>
      <View style={bf.summaryBox}>
        <Text style={bf.summaryLabel}>Модель / версия протокола</Text>
        <Text style={bf.summaryValue}>
          {dual.modelId} @ {dual.modelVersion}
        </Text>
        <Text style={bf.summaryLabel}>Статус анфас</Text>
        <Text style={bf.summaryValue}>{dual.frontal.quality}</Text>
        <Text style={bf.summaryLabel}>Статус профиль</Text>
        <Text style={bf.summaryValue}>{dual.profile.quality}</Text>
        {dual.frontal.qualityNote != null ? (
          <>
            <Text style={bf.summaryLabel}>Сервисное (анфас)</Text>
            <Text style={bf.summaryValue}>{dual.frontal.qualityNote}</Text>
          </>
        ) : null}
        {dual.profile.qualityNote != null ? (
          <>
            <Text style={bf.summaryLabel}>Сервисное (профиль)</Text>
            <Text style={bf.summaryValue}>{dual.profile.qualityNote}</Text>
          </>
        ) : null}
      </View>
      <PoseSessionVisualization dual={dual} />
      <Text style={[bf.blockTitle, { marginTop: 16 }]}>Числа по ракурсам</Text>
      <Text style={bf.captureHint}>
        Значения и «идеал» задаются продуктовыми эталонами в константе POSE_NUMERIC_IDEALS, это не клиническая
        норма; отклонение = факт − идеал. Координаты точек MediaPipe нормированы в кадре 0…1.
      </Text>
      <Block bf={bf} rows={dual.frontal.numericRows} subtitle="Анфас" />
      <Block bf={bf} rows={dual.profile.numericRows} subtitle="Профиль" />
      {footer}
    </>
  );
}
