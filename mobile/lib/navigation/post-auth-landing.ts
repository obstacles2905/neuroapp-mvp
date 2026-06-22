import type { AppUserMe } from '@/lib/api/types/app-auth.types';
import { getSessionContinuationHref } from '@/lib/navigation/session-continuation';
import { type Href } from 'expo-router';

/**
 * Куда вести после login/register.
 */
export function getPostAuthLandingHref(me: AppUserMe): Href {
  if (me.needsOnboarding) {
    return '/(onboarding)' as Href;
  }
  return getSessionContinuationHref(me);
}
