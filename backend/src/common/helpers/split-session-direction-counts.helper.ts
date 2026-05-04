export function splitSessionDirectionCounts(
  totalSteps: number,
  avgBottomUpPercent: number,
  hasBottomPool: boolean,
  hasTopPool: boolean,
): { bottomUp: number; topDown: number } {
  if (totalSteps <= 0) {
    return { bottomUp: 0, topDown: 0 };
  }
  if (!hasBottomPool && !hasTopPool) {
    return { bottomUp: 0, topDown: 0 };
  }
  if (!hasBottomPool) {
    return { bottomUp: 0, topDown: totalSteps };
  }
  if (!hasTopPool) {
    return { bottomUp: totalSteps, topDown: 0 };
  }
  const bu = Math.min(
    Math.max(Math.round((totalSteps * avgBottomUpPercent) / 100), 0),
    totalSteps,
  );
  return { bottomUp: bu, topDown: totalSteps - bu };
}
