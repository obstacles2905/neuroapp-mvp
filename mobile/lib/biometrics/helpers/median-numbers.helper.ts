export function medianOfNumbers(values: readonly number[]): number | undefined {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) {
    return undefined;
  }
  const sorted = [...finite].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  const a = sorted[mid - 1];
  const b = sorted[mid];
  if (a === undefined || b === undefined) {
    return undefined;
  }
  return (a + b) / 2;
}
