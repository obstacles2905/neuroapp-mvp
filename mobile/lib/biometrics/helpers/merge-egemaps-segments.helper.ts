import type { OpensmileLowLevelFeatureSnapshot } from '@/lib/biometrics/voice/opensmile-feature-extractor';

export function mergeEgMapsSegments(
  rows: readonly (OpensmileLowLevelFeatureSnapshot & {
    gemapsFunctionals: Record<string, number>;
  })[],
): Record<string, number> {
  const keys = new Set<string>();
  for (const r of rows) {
    Object.keys(r.gemapsFunctionals).forEach((k) => keys.add(k));
  }
  const out: Record<string, number> = {};
  for (const k of keys) {
    let sum = 0;
    let n = 0;
    for (const r of rows) {
      const v = r.gemapsFunctionals[k];
      if (v !== undefined && Number.isFinite(v)) {
        sum += v;
        n += 1;
      }
    }
    if (n > 0) {
      out[k] = sum / n;
    }
  }
  return out;
}

export function isBrokenEgmapsCsvShape(merged: Record<string, number>): boolean {
  const keys = Object.keys(merged);
  if (keys.length !== 1) {
    return false;
  }
  const onlyKey = keys[0] ?? '';
  return onlyKey.includes(';') && onlyKey.toLowerCase().includes('f0semitone');
}

export function rowsWithEgmaps(
  rows: readonly OpensmileLowLevelFeatureSnapshot[],
): (OpensmileLowLevelFeatureSnapshot & { gemapsFunctionals: Record<string, number> })[] {
  return rows.filter(
    (r): r is OpensmileLowLevelFeatureSnapshot & { gemapsFunctionals: Record<string, number> } =>
      r.gemapsFunctionals != null && Object.keys(r.gemapsFunctionals).length > 0,
  );
}
