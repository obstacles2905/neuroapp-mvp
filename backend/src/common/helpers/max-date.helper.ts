export function maxDate(values: Array<Date | null | undefined>): Date | null {
  const timestamps = values
    .filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()))
    .map((d) => d.getTime());
  if (timestamps.length === 0) {
    return null;
  }
  return new Date(Math.max(...timestamps));
}
