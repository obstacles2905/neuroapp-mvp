import type { AppUserMe } from '@/lib/api/types/app-auth.types';
import { type Href } from 'expo-router';

/**
 * Куда вести после login/register: `needsOnboarding` из `GET /me` (учёт пропуска).
 */
export function getPostAuthLandingHref(me: AppUserMe): Href {
  if (me.needsOnboarding) {
    return '/(onboarding)' as Href;
  }
  return '/(app)/(tabs)' as Href;
}
