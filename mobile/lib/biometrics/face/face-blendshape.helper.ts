import type { FaceBlendshapeMap, FaceBlendshapeScore } from '@/lib/biometrics/types/face-measurement.types';

export function blendshapeScoresToMap(
  scores: readonly FaceBlendshapeScore[],
): FaceBlendshapeMap {
  const out: Record<string, number> = {};
  for (const item of scores) {
    out[item.categoryName] = item.score;
  }
  return out;
}

export function getBlendshapeValue(
  map: FaceBlendshapeMap,
  name: string,
): number {
  return map[name] ?? 0;
}

export function meanBlendshapeValues(
  map: FaceBlendshapeMap,
  names: readonly string[],
): number {
  if (names.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const name of names) {
    sum += getBlendshapeValue(map, name);
  }
  return sum / names.length;
}

export function meanAsymmetryAcrossPairs(
  map: FaceBlendshapeMap,
  pairs: ReadonlyArray<readonly [string, string]>,
): number {
  if (pairs.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const [left, right] of pairs) {
    sum += Math.abs(getBlendshapeValue(map, left) - getBlendshapeValue(map, right));
  }
  return sum / pairs.length;
}

export function clampScore0to100(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 100) {
    return 100;
  }
  return Math.round(value * 10) / 10;
}
