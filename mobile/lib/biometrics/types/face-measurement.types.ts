/** Источник кадра для фазы протокола мимики. */
export type FaceFrameSource = 'camera' | 'gallery';

/** Фазы протокола MVP: baseline + guided expressions. */
export type FaceProtocolPhase =
  | 'baseline'
  | 'guided_smile'
  | 'guided_frown'
  | 'guided_surprise';

export type FaceBlendshapeScore = Readonly<{
  categoryName: string;
  score: number;
}>;

export type FaceBlendshapeMap = Readonly<Record<string, number>>;

/** Один кадр/серия после инференса Face Landmarker. */
export type FaceBlendshapeFrame = Readonly<{
  blendshapes: FaceBlendshapeMap;
  frameHeight: number;
  frameUri: string;
  frameWidth: number;
  inferenceMs: number;
  phase: FaceProtocolPhase;
  source: FaceFrameSource;
}>;

/** Наблюдение фазы до инференса. */
export type FacePhaseObservation = Readonly<{
  frameUris: readonly string[];
  phase: FaceProtocolPhase;
  source: FaceFrameSource;
}>;

export type FaceSessionQualityOverall = 'ok' | 'retry_suggested' | 'failed';

/** Совпадение выражения с инструкцией шага (калибруется по test-photos). */
export type FacePhaseComplianceResult = Readonly<{
  matched: boolean;
  phase: FaceProtocolPhase;
  reasonCode: string | null;
  retryHint: string | null;
  /** Сырой target-score фазы (0..1), для отладки/пересчёта. */
  targetScore: number;
}>;

export type FaceCaptureQualityResult = Readonly<{
  failureReasons: readonly string[];
  faceDetectedRatio: number;
  overall: FaceSessionQualityOverall;
  /** Результаты проверки «эмоция ≈ шаг протокола»; может отсутствовать у старых записей. */
  phaseCompliance?: readonly FacePhaseComplianceResult[] | undefined;
  retryHints: readonly string[];
}>;

export type FaceExpressionProductMetrics = Readonly<{
  asymmetryScore: number;
  expressivenessScore: number;
  facialTensionScore: number;
}>;

/** Уровень метрики для UI: слова важнее сырого score. */
export type FaceMetricBandLevel = 'low' | 'mid' | 'high';

export type FaceMetricBand = Readonly<{
  /** Короткая подпись уровня («сдержанная», «расслаблено»). */
  label: string;
  level: FaceMetricBandLevel;
  /** Одна фраза «что это значит» для пользователя. */
  meaning: string;
  score: number;
}>;

/** Человеко-читаемая интерпретация (как у голоса/позы), не медицинский вывод. */
export type FaceSessionInterpretation = Readonly<{
  asymmetry: FaceMetricBand;
  bullets: readonly string[];
  disclaimerLine: string;
  expressiveness: FaceMetricBand;
  facialTension: FaceMetricBand;
  headline: string;
  /** Один следующий шаг по доминирующему сигналу. */
  nextStep: string;
  tone: 'attention' | 'neutral' | 'positive';
}>;

export type FacePhaseMetricsSnapshot = Readonly<{
  blendshapes: FaceBlendshapeMap;
  phase: FaceProtocolPhase;
}>;

export type FaceExpressionMeasurementSession = Readonly<{
  capturedAt: string;
  extractorId: 'mediapipe-face-landmarker';
  extractorVersion: string;
  id: string;
  /** Есть у новых сессий; у старых записей на устройстве может отсутствовать. */
  interpretation?: FaceSessionInterpretation | undefined;
  metrics: FaceExpressionProductMetrics;
  phaseSnapshots: readonly FacePhaseMetricsSnapshot[];
  protocolVersion: string;
  quality: FaceCaptureQualityResult;
  scoringVersion: string;
}>;
