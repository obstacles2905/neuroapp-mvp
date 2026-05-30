import { POSE_LANDMARK_MIN_VISIBILITY } from '@/lib/biometrics/constants/pose-capture.constants';
import { PoseLandmarkIndex } from '@/lib/biometrics/constants/pose-landmark-indices';
import { POSE_MEDIAPIPE_EDGE_INDICES } from '@/lib/biometrics/constants/pose-media-pipe-connectivity.constants';
import { landmarkEdgeKey } from '@/lib/biometrics/constants/pose-overlay-metric-mapping.constants';
import {
  poseComputeImageContainRect,
  poseLandmarkToContainPx,
  type PoseImageContainRect,
} from '@/lib/biometrics/helpers/pose-image-contain.helper';
import {
  buildIdealSkeleton,
  type PoseIdealPoint,
} from '@/lib/biometrics/helpers/pose-ideal-skeleton.helper';
import { overlayBuildSeverityByEdgeKey } from '@/lib/biometrics/helpers/pose-skeleton-severity.helper';
import type {
  PoseCaptureViewKind,
  PoseLandmarkPoint,
  PoseNumericMetricRow,
} from '@/lib/biometrics/types/pose-measurement.types';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useEffect, useMemo, useState, type JSX } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const KEY_USER_JOINT_INDICES: ReadonlyArray<number> = [
  PoseLandmarkIndex.nose,
  PoseLandmarkIndex.leftShoulder,
  PoseLandmarkIndex.rightShoulder,
  PoseLandmarkIndex.leftHip,
  PoseLandmarkIndex.rightHip,
];

const IDEAL_EDGE_COLOR = '#84CC16';
const IDEAL_JOINT_COLOR = '#BBF7D0';
const IDEAL_EDGE_DASH = '6,5';
const USER_BASE_COLOR_FROM = { r: 165, g: 243, b: 252 } as const;
const USER_BASE_COLOR_TO = { r: 234, g: 88, b: 12 } as const;

function lmVisibility(p: PoseLandmarkPoint | undefined): number {
  if (p == null) {
    return 0;
  }
  return p.visibility ?? p.presence ?? 1;
}

function rgbInterp(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  const r = Math.round(USER_BASE_COLOR_FROM.r + (USER_BASE_COLOR_TO.r - USER_BASE_COLOR_FROM.r) * x);
  const g = Math.round(USER_BASE_COLOR_FROM.g + (USER_BASE_COLOR_TO.g - USER_BASE_COLOR_FROM.g) * x);
  const b = Math.round(USER_BASE_COLOR_FROM.b + (USER_BASE_COLOR_TO.b - USER_BASE_COLOR_FROM.b) * x);
  return `rgb(${String(r)},${String(g)},${String(b)})`;
}

function edgeStrokeForSeverity(severity: number): { color: string; width: number } {
  return {
    color: rgbInterp(severity),
    width: 2 + severity * 3,
  };
}

function landmarkToContainPx(
  lm: PoseLandmarkPoint,
  rect: PoseImageContainRect,
): Readonly<{ x: number; y: number }> {
  return poseLandmarkToContainPx({ x: lm.x, y: lm.y }, rect);
}

function idealPointToContainPx(
  p: PoseIdealPoint,
  rect: PoseImageContainRect,
): Readonly<{ x: number; y: number }> {
  return poseLandmarkToContainPx(p, rect);
}

export type PosePhotoSkeletonOverlayProps = {
  /** Высота нормализованного кадра в пикселях; если нет — overlay подгрузит через `Image.getSize`. */
  frameHeight?: number | undefined;
  /** Ширина нормализованного кадра в пикселях. */
  frameWidth?: number | undefined;
  landmarks: PoseLandmarkPoint[];
  numericRows: PoseNumericMetricRow[];
  uri: string;
  viewKind: PoseCaptureViewKind;
};

type FrameSize = Readonly<{ height: number; width: number }>;

function useResolvedFrameSize(
  uri: string,
  presetWidth?: number | undefined,
  presetHeight?: number | undefined,
): { error: boolean; size: FrameSize | null } {
  const [size, setSize] = useState<FrameSize | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof presetWidth === 'number' && presetWidth > 0 && typeof presetHeight === 'number' && presetHeight > 0) {
      setError(false);
      setSize({ height: presetHeight, width: presetWidth });
      return;
    }

    setError(false);
    setSize(null);
    let alive = true;

    Image.getSize(
      uri,
      (w, h) => {
        if (alive) {
          setSize({ height: h, width: w });
        }
      },
      () => {
        if (alive) {
          setError(true);
        }
      },
    );

    return () => {
      alive = false;
    };
  }, [uri, presetWidth, presetHeight]);

  return { error, size };
}

export function PosePhotoSkeletonOverlay(props: PosePhotoSkeletonOverlayProps): JSX.Element {
  const t = useAppTheme();
  const { landmarks, numericRows, uri, viewKind, frameWidth, frameHeight } = props;
  const { error: sizeError, size: frameSize } = useResolvedFrameSize(uri, frameWidth, frameHeight);
  const [box, setBox] = useState({ h: 0, w: 0 });

  const severityByEdge = useMemo(
    () => overlayBuildSeverityByEdgeKey(viewKind, numericRows, landmarks),
    [landmarks, numericRows, viewKind],
  );

  const idealSkeleton = useMemo(
    () => buildIdealSkeleton(viewKind, landmarks),
    [landmarks, viewKind],
  );

  const rect =
    box.w > 0 && box.h > 0 && frameSize != null && frameSize.width > 0 && frameSize.height > 0
      ? poseComputeImageContainRect(box.w, box.h, frameSize.width, frameSize.height)
      : null;

  return (
    <View style={styles.canvas}>
      {sizeError ? (
        <Text style={[styles.helper, { color: t.warningText }]}>
          Не удалось открыть снимок для оверлея (URI кадра).
        </Text>
      ) : null}
      <View
        onLayout={(e) => {
          const { height, width } = e.nativeEvent.layout;
          setBox((prev) => (prev.w === width && prev.h === height ? prev : { h: height, w: width }));
        }}
        style={styles.photoViewport}
      >
        {frameSize == null && !sizeError ? (
          <View style={styles.loader}>
            <ActivityIndicator color={t.tint} size="large" />
          </View>
        ) : null}
        {rect != null && rect.drawWidth > 0 && rect.drawHeight > 0 ? (
          <>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={{ uri }}
              style={{
                height: rect.drawHeight,
                left: rect.offsetX,
                position: 'absolute',
                top: rect.offsetY,
                width: rect.drawWidth,
              }}
            />
            <Svg height={box.h} pointerEvents="none" style={StyleSheet.absoluteFillObject} width={box.w}>
              {POSE_MEDIAPIPE_EDGE_INDICES.map(([ai, bi]) => {
                const pa = landmarks[ai];
                const pb = landmarks[bi];
                if (
                  lmVisibility(pa) < POSE_LANDMARK_MIN_VISIBILITY ||
                  lmVisibility(pb) < POSE_LANDMARK_MIN_VISIBILITY ||
                  pa == null ||
                  pb == null
                ) {
                  return null;
                }
                const p0 = landmarkToContainPx(pa, rect);
                const p1 = landmarkToContainPx(pb, rect);
                const sev = severityByEdge.get(landmarkEdgeKey(ai, bi)) ?? 0;
                const st = edgeStrokeForSeverity(sev);
                return (
                  <Line
                    key={`user_e_${String(ai)}_${String(bi)}`}
                    stroke={st.color}
                    strokeLinecap="round"
                    strokeWidth={st.width}
                    x1={p0.x}
                    x2={p1.x}
                    y1={p0.y}
                    y2={p1.y}
                  />
                );
              })}
              {KEY_USER_JOINT_INDICES.map((idx) => {
                const p = landmarks[idx];
                if (lmVisibility(p) < POSE_LANDMARK_MIN_VISIBILITY || p == null) {
                  return null;
                }
                const { x, y } = landmarkToContainPx(p, rect);
                return (
                  <Circle
                    key={`user_j_${String(idx)}`}
                    cx={x}
                    cy={y}
                    fill="rgba(255,255,255,0.35)"
                    r={3.5}
                    stroke="rgba(11,18,32,0.45)"
                    strokeWidth={1}
                  />
                );
              })}
              {idealSkeleton != null
                ? idealSkeleton.edges.map((edge, i) => {
                    const p0 = idealPointToContainPx(edge.a, rect);
                    const p1 = idealPointToContainPx(edge.b, rect);
                    return (
                      <Line
                        key={`ideal_e_${String(i)}`}
                        stroke={IDEAL_EDGE_COLOR}
                        strokeDasharray={IDEAL_EDGE_DASH}
                        strokeLinecap="round"
                        strokeOpacity={0.95}
                        strokeWidth={2.2}
                        x1={p0.x}
                        x2={p1.x}
                        y1={p0.y}
                        y2={p1.y}
                      />
                    );
                  })
                : null}
              {idealSkeleton != null
                ? idealSkeleton.joints.map((joint, i) => {
                    const { x, y } = idealPointToContainPx(joint, rect);
                    return (
                      <Circle
                        key={`ideal_j_${String(i)}`}
                        cx={x}
                        cy={y}
                        fill={IDEAL_JOINT_COLOR}
                        r={3}
                        stroke={IDEAL_EDGE_COLOR}
                        strokeOpacity={0.95}
                        strokeWidth={1.5}
                      />
                    );
                  })
                : null}
            </Svg>
          </>
        ) : null}
      </View>
      {frameSize != null ? (
        <Text style={styles.caption}>
          Бирюза/оранж — твой реальный каркас MediaPipe; чем теплее и толще линия, тем сильнее отклонение по
          соответствующим числам ниже. Зелёный пунктир — целевая поза «как было бы при ровной осанке».
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    alignSelf: 'stretch',
    backgroundColor: '#0b1220',
    borderRadius: 12,
    overflow: 'hidden',
  },
  caption: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    lineHeight: 17,
    paddingBottom: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  helper: {
    padding: 16,
    textAlign: 'center',
  },
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 240,
  },
  photoViewport: {
    alignSelf: 'stretch',
    minHeight: 260,
    position: 'relative',
    width: '100%',
  },
});
