import type { AppUserMe } from '@/lib/api/types/app-auth.types';
import { isBiometricsOnlyMode } from '@/lib/config/feature-flags';
import { type Href } from 'expo-router';

/** Единственный экран приложения в режиме biometrics-only. */
export const BIOMETRICS_ONLY_HREF = '/(app)/(tabs)/biometrics' as Href;

export function getSessionContinuationHref(me: AppUserMe): Href {
  if (isBiometricsOnlyMode) {
    return BIOMETRICS_ONLY_HREF;
  }
  if (me.needsOnboarding) {
    return '/(onboarding)' as Href;
  }
  return '/(app)/(tabs)' as Href;
}
