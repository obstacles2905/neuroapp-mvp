import type { MndExercise } from '../entity/mnd-exercise.entity';
import { shuffleCopyWithRng } from './shuffle-with-rng.helper';

export function pickSessionExercisesFromPool(
  pool: readonly MndExercise[],
  count: number,
  rng: () => number,
): MndExercise[] {
  if (count <= 0 || pool.length === 0) {
    return [];
  }
  const shuffled = shuffleCopyWithRng(pool, rng);
  if (shuffled.length >= count) {
    return shuffled.slice(0, count);
  }
  const out = [...shuffled];
  while (out.length < count) {
    const pick = pool[Math.floor(rng() * pool.length)]!;
    out.push(pick);
  }
  return out;
}
