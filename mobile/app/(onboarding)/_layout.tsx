import { Stack, Redirect } from 'expo-router';

import { NAV_MOTION } from '@/constants/navigation-motion';
import { useAppTheme } from '@/hooks/useAppTheme';
import { isBiometricsOnlyMode } from '@/lib/config/feature-flags';
import { BIOMETRICS_ONLY_HREF } from '@/lib/navigation/session-continuation';

export default function OnboardingLayout(): React.JSX.Element {
  const t = useAppTheme();

  if (isBiometricsOnlyMode) {
    return <Redirect href={BIOMETRICS_ONLY_HREF} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'Онбординг',
        animation: 'fade',
        animationDuration: NAV_MOTION.rootFadeMs,
        contentStyle: { backgroundColor: t.background },
      }}
    />
  );
}
