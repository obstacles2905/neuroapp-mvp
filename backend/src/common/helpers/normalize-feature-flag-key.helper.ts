export function normalizeFeatureFlagKey(
  raw: string | null | undefined,
): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  const t = raw.trim();
  return t.length === 0 ? null : t;
}
