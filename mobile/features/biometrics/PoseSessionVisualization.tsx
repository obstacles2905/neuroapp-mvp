import { useBiometricFlowStyles } from '@/features/biometrics/biometric-flow-styles';
import { PosePhotoSkeletonOverlay } from '@/features/biometrics/PosePhotoSkeletonOverlay';
import type { PoseDualViewSessionResult } from '@/lib/biometrics/types/pose-measurement.types';
import { type JSX } from 'react';
import { Platform, Text, View } from 'react-native';

export function PoseSessionVisualization({
  dual,
}: Readonly<{ dual: PoseDualViewSessionResult }>): JSX.Element | null {
  const bf = useBiometricFlowStyles();

  if (Platform.OS === 'web') {
    return null;
  }

  const vf = dual.frontal.visualization;
  const vp = dual.profile.visualization;
  if (vf == null && vp == null) {
    return null;
  }

  return (
    <>
      <Text style={[bf.blockTitle, { marginTop: 16 }]}>Наглядно на фото</Text>
      <Text style={bf.captureHint}>
        Кадры предварительно нормализованы: EXIF Orientation запечён в пиксели, MediaPipe и `&lt;Image /&gt;` работают
        в одной системе координат. На фото — два каркаса: бирюзово-оранжевый «твой» с цветом по тяжести отклонений
        и зелёный пунктирный «целевой» (где точки должны бы лежать при ровной осанке). Это визуализация, не
        медицинский вывод.
      </Text>
      {vf != null ? (
        <View style={[bf.summaryBox, { marginTop: 12, overflow: 'hidden', padding: 0 }]}>
          <Text style={[bf.captureTitle, { paddingHorizontal: 16, paddingTop: 12 }]}>Анфас</Text>
          <PosePhotoSkeletonOverlay
            frameHeight={vf.frameHeight}
            frameWidth={vf.frameWidth}
            landmarks={vf.landmarks}
            numericRows={dual.frontal.numericRows}
            uri={vf.chosenFrameUri}
            viewKind="frontal"
          />
        </View>
      ) : null}
      {vp != null ? (
        <View style={[bf.summaryBox, { marginTop: 12, overflow: 'hidden', padding: 0 }]}>
          <Text style={[bf.captureTitle, { paddingHorizontal: 16, paddingTop: 12 }]}>Профиль</Text>
          <PosePhotoSkeletonOverlay
            frameHeight={vp.frameHeight}
            frameWidth={vp.frameWidth}
            landmarks={vp.landmarks}
            numericRows={dual.profile.numericRows}
            uri={vp.chosenFrameUri}
            viewKind="profile"
          />
        </View>
      ) : null}
    </>
  );
}
