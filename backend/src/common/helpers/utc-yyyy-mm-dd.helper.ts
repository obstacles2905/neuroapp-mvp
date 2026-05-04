/**
 * Календарный день в UTC (`YYYY-MM-DD`) для стрика активности.
 */
export function toUtcYyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function utcYyyyMmDdYesterday(yMd: string): string {
  const t = new Date(`${yMd}T12:00:00.000Z`);
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}
