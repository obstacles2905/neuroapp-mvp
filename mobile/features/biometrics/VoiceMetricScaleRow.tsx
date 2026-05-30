import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import type { VoiceMetricScaleRowModel } from '@/lib/biometrics/helpers/voice-metric-scales.helper';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { JSX } from 'react';
import { Text, View } from 'react-native';

export type VoiceMetricScaleRowProps = {
  row: VoiceMetricScaleRowModel;
};

const MARKER_SIZE = 14;

export function VoiceMetricScaleRow({ row }: VoiceMetricScaleRowProps): JSX.Element {
  const t = useAppTheme();
  const bf = useBiometricFlowStyles();
  const positionPct = Math.min(100, Math.max(0, row.value));

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[bf.summaryLabel, { color: t.text, fontSize: 15, fontWeight: '600' }]}>
          {row.title}
        </Text>
        <Text style={{ color: t.tint, fontSize: 17, fontWeight: '800' }}>{String(row.value)}</Text>
      </View>

      <View style={{ height: MARKER_SIZE + 6, justifyContent: 'center', marginTop: 10 }}>
        <View
          style={{
            backgroundColor: t.border,
            borderRadius: 3,
            height: 6,
            width: '100%',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            alignItems: 'flex-end',
            justifyContent: 'center',
            left: 0,
            position: 'absolute',
            top: 0,
            width: `${String(positionPct)}%`,
          }}
        >
          <View
            style={{
              backgroundColor: t.tint,
              borderColor: t.background,
              borderRadius: MARKER_SIZE / 2,
              borderWidth: 2,
              height: MARKER_SIZE,
              width: MARKER_SIZE,
            }}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
      >
        <Text style={[bf.captureHint, { color: t.textMuted, fontSize: 12, textAlign: 'left' }]}>
          {row.leftLabel}
        </Text>
        <Text style={[bf.captureHint, { color: t.textMuted, fontSize: 12, textAlign: 'right' }]}>
          {row.rightLabel}
        </Text>
      </View>

      {row.comparisonHint != null && row.comparisonHint.length > 0 ? (
        <Text style={[bf.captureHint, { color: t.textSecondary, marginTop: 4, textAlign: 'left' }]}>
          {row.comparisonHint}
        </Text>
      ) : null}
    </View>
  );
}
