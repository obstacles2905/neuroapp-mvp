import type { AppUserMe } from '@/lib/api/types/app-auth.types';
import { type Href } from 'expo-router';

export function getSessionContinuationHref(me: AppUserMe): Href {
  if (me.needsOnboarding) {
    return '/(onboarding)' as Href;
  }
  return '/(app)/(tabs)' as Href;
}
