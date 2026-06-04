export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) {
    return `${h} ч`;
  }
  return `${h} ч ${m} мин`;
}

export function formatMs(ms: number): string {
  return formatMinutes(Math.round(ms / 60_000));
}
