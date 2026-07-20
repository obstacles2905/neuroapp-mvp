import {
  FACE_BASELINE_CONTRADICTION_BROW_DOWN,
  FACE_BASELINE_CONTRADICTION_JAW_OPEN,
  FACE_BASELINE_CONTRADICTION_SMILE,
  FACE_FROWN_CONTRADICTION_MARGIN,
  FACE_FROWN_CONTRADICTION_SMILE,
  FACE_GUIDED_PHASE_SHAPES,
  FACE_SMILE_CONTRADICTION_BROW_DOWN,
  FACE_SMILE_CONTRADICTION_MARGIN,
  FACE_SURPRISE_CONTRADICTION_BROW_DOWN,
} from '@/lib/biometrics/constants/face-scoring.constants';
import {
  getBlendshapeValue,
  meanBlendshapeValues,
} from '@/lib/biometrics/face/face-blendshape.helper';
import type {
  FaceBlendshapeMap,
  FacePhaseComplianceResult,
  FacePhaseMetricsSnapshot,
  FaceProtocolPhase,
} from '@/lib/biometrics/types/face-measurement.types';

function findPhaseSnapshot(
  snapshots: readonly FacePhaseMetricsSnapshot[],
  phase: FaceProtocolPhase,
): FacePhaseMetricsSnapshot | null {
  return snapshots.find((s) => s.phase === phase) ?? null;
}

function smileScore(map: FaceBlendshapeMap): number {
  return meanBlendshapeValues(map, FACE_GUIDED_PHASE_SHAPES.guided_smile);
}

function browDownScore(map: FaceBlendshapeMap): number {
  return meanBlendshapeValues(map, FACE_GUIDED_PHASE_SHAPES.guided_frown);
}

function surpriseCoreScore(map: FaceBlendshapeMap): number {
  return meanBlendshapeValues(map, ['browInnerUp', 'eyeWideLeft', 'eyeWideRight']);
}

function ok(phase: FaceProtocolPhase, targetScore: number): FacePhaseComplianceResult {
  return { matched: true, phase, reasonCode: null, retryHint: null, targetScore };
}

function contradiction(
  phase: FaceProtocolPhase,
  reasonCode: string,
  retryHint: string,
  targetScore: number,
): FacePhaseComplianceResult {
  return { matched: false, phase, reasonCode, retryHint, targetScore };
}

function evaluateBaseline(snap: FacePhaseMetricsSnapshot): FacePhaseComplianceResult {
  const smile = smileScore(snap.blendshapes);
  const browDown = browDownScore(snap.blendshapes);
  const jawOpen = getBlendshapeValue(snap.blendshapes, 'jawOpen');
  const strongExpression =
    smile >= FACE_BASELINE_CONTRADICTION_SMILE ||
    browDown >= FACE_BASELINE_CONTRADICTION_BROW_DOWN ||
    jawOpen >= FACE_BASELINE_CONTRADICTION_JAW_OPEN;

  if (!strongExpression) {
    return ok('baseline', Math.max(smile, browDown, jawOpen));
  }
  return contradiction(
    'baseline',
    'baseline_active',
    'На спокойном шаге лицо было заметно активным — для точного замера попробуй ещё раз с расслабленным лицом.',
    Math.max(smile, browDown, jawOpen),
  );
}

function evaluateSmile(snap: FacePhaseMetricsSnapshot): FacePhaseComplianceResult {
  const smile = smileScore(snap.blendshapes);
  const browDown = browDownScore(snap.blendshapes);
  const clearlyFrowning =
    browDown >= FACE_SMILE_CONTRADICTION_BROW_DOWN &&
    browDown >= smile + FACE_SMILE_CONTRADICTION_MARGIN;

  if (!clearlyFrowning) {
    return ok('guided_smile', smile);
  }
  return contradiction(
    'guided_smile',
    'smile_looks_frown',
    'На шаге улыбки выражение вышло скорее хмурым — при желании переснимай с улыбкой, это не ошибка.',
    smile,
  );
}

function evaluateFrown(snap: FacePhaseMetricsSnapshot): FacePhaseComplianceResult {
  const browDown = browDownScore(snap.blendshapes);
  const smile = smileScore(snap.blendshapes);
  const clearlySmiling =
    smile >= FACE_FROWN_CONTRADICTION_SMILE &&
    smile >= browDown + FACE_FROWN_CONTRADICTION_MARGIN;

  if (!clearlySmiling) {
    return ok('guided_frown', browDown);
  }
  return contradiction(
    'guided_frown',
    'frown_looks_smile',
    'На шаге хмурых бровей вышла скорее улыбка — при желании переснимай, это не ошибка.',
    browDown,
  );
}

function evaluateSurprise(snap: FacePhaseMetricsSnapshot): FacePhaseComplianceResult {
  const browDown = browDownScore(snap.blendshapes);
  const core = surpriseCoreScore(snap.blendshapes);
  const clearlyAngry =
    browDown >= FACE_SURPRISE_CONTRADICTION_BROW_DOWN && browDown >= core;

  if (!clearlyAngry) {
    return ok('guided_surprise', core);
  }
  return contradiction(
    'guided_surprise',
    'surprise_looks_angry',
    'На шаге удивления выражение вышло скорее сердитым — при желании переснимай, это не ошибка.',
    core,
  );
}

/**
 * Проверяет каждый шаг на ЯВНОЕ противоречие инструкции.
 * matched === true означает «нет явного противоречия» (в т.ч. слабую мимику
 * считаем нормой — не придираемся), matched === false — сделана отчётливо
 * противоположная эмоция.
 */
export function evaluateFacePhaseCompliance(
  snapshots: readonly FacePhaseMetricsSnapshot[],
): FacePhaseComplianceResult[] {
  const evaluators: Record<
    FaceProtocolPhase,
    (snap: FacePhaseMetricsSnapshot) => FacePhaseComplianceResult
  > = {
    baseline: evaluateBaseline,
    guided_frown: evaluateFrown,
    guided_smile: evaluateSmile,
    guided_surprise: evaluateSurprise,
  };

  const phases: FaceProtocolPhase[] = [
    'baseline',
    'guided_smile',
    'guided_frown',
    'guided_surprise',
  ];

  const results: FacePhaseComplianceResult[] = [];
  for (const phase of phases) {
    const snap = findPhaseSnapshot(snapshots, phase);
    if (snap == null) {
      results.push(ok(phase, 0));
      continue;
    }
    results.push(evaluators[phase](snap));
  }
  return results;
}
