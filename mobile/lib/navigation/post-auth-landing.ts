import type { AppUserMe } from '@/lib/api/types/app-auth.types';
import { isBiometricsOnlyMode } from '@/lib/config/feature-flags';
import {
  BIOMETRICS_ONLY_HREF,
  getSessionContinuationHref,
} from '@/lib/navigation/session-continuation';
import { type Href } from 'expo-router';

/**
 * Куда вести после login/register.
 */
export function getPostAuthLandingHref(me: AppUserMe): Href {
  if (isBiometricsOnlyMode) {
    return BIOMETRICS_ONLY_HREF;
  }
  if (me.needsOnboarding) {
    return '/(onboarding)' as Href;
  }
  return getSessionContinuationHref(me);
}
