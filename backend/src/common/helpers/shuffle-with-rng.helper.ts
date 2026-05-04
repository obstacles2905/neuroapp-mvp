export function shuffleCopyWithRng<T>(
  items: readonly T[],
  rng: () => number,
): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i];
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}
