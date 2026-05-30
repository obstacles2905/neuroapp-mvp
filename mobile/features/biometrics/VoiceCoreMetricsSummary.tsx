import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import { VoiceMetricScaleRow } from '@/features/biometrics/VoiceMetricScaleRow';
import {
  buildVoiceMetricScaleRows,
  buildVoicePitchCaption,
  buildVoiceSummaryFootnote,
} from '@/lib/biometrics/helpers/voice-metric-scales.helper';
import type { VoiceMeasurementSession } from '@/lib/biometrics/types/voice-measurement.types';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { JSX } from 'react';
import { Text, View } from 'react-native';

export type VoiceCoreMetricsSummaryProps = {
  session: VoiceMeasurementSession;
};

export function VoiceCoreMetricsSummary({ session }: VoiceCoreMetricsSummaryProps): JSX.Element {
  const bf = useBiometricFlowStyles();
  const t = useAppTheme();
  const rows = buildVoiceMetricScaleRows(session);
  const pitchCaption = buildVoicePitchCaption(session);
  const footnote = buildVoiceSummaryFootnote(session);

  return (
    <View style={bf.summaryBox}>
      <Text style={[bf.summaryLabel, { color: t.textSecondary, marginBottom: 4 }]}>
        Шкала 0–100: где находится ваша запись между двумя полюсами. Это не диагноз, а
        акустические маркеры по методике.
      </Text>

      {pitchCaption != null ? (
        <Text style={[bf.summaryValue, { marginTop: 8 }]}>{pitchCaption}</Text>
      ) : null}

      {rows.map((row) => (
        <VoiceMetricScaleRow key={row.id} row={row} />
      ))}

      {footnote != null ? (
        <Text style={[bf.captureHint, { color: t.textSecondary, marginTop: 14 }]}>{footnote}</Text>
      ) : null}
    </View>
  );
}
