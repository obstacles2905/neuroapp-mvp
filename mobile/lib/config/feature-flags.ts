/**
 * Client feature flags (EXPO_PUBLIC_* — inlined at build time).
 */

export const isBiometricsOnlyMode =
  process.env.EXPO_PUBLIC_BIOMETRICS_ONLY === 'true' ||
  process.env.EXPO_PUBLIC_BIOMETRICS_ONLY === '1';
