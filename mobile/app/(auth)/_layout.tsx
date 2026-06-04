import { Stack } from 'expo-router';

import { NAV_MOTION } from '@/constants/navigation-motion';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function AuthLayout(): React.JSX.Element {
  const t = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerTitle: 'neuro',
        animation: 'fade',
        animationDuration: NAV_MOTION.rootFadeMs,
        contentStyle: { backgroundColor: t.background },
      }}
    />
  );
}
