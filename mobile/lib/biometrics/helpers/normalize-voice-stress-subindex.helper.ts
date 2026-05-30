export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

/** x выше baseline → стресс (0 если x ≤ baseline). */
export function stressSubindexHigherIsWorse(
  current: number,
  baseline: number,
  spread: number,
): number {
  const delta = current - baseline;
  if (delta <= 0) {
    return 0;
  }
  const span = Math.max(spread, 1e-9);
  return clampUnit(delta / span);
}

/** x ниже baseline → стресс (монотонность / сужение range). */
export function stressSubindexLowerIsWorse(
  current: number,
  baseline: number,
  spread: number,
): number {
  const delta = baseline - current;
  if (delta <= 0) {
    return 0;
  }
  const span = Math.max(spread, 1e-9);
  return clampUnit(delta / span);
}

/** Линейная нормировка x в [min, max] → 0–1. */
export function stressSubindexLinearHigh(
  current: number,
  min: number,
  max: number,
): number {
  const span = max - min;
  if (span <= 0) {
    return 0;
  }
  return clampUnit((current - min) / span);
}

/** Инверсия: чем меньше x относительно [min, max], тем выше стресс. */
export function stressSubindexLinearLow(
  current: number,
  min: number,
  max: number,
): number {
  const span = max - min;
  if (span <= 0) {
    return 0;
  }
  return clampUnit((max - current) / span);
}
