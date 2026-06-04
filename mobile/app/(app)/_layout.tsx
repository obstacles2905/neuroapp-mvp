import { Stack } from 'expo-router';

import { NAV_MOTION } from '@/constants/navigation-motion';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUsageTrackingBootstrap } from '@/hooks/useUsageTracking';

export default function AppGroupLayout(): React.JSX.Element {
  const t = useAppTheme();
  useUsageTrackingBootstrap();

  return (
    <Stack
      screenOptions={{
        animation: 'fade',
        animationDuration: NAV_MOTION.stackFadeMs,
        contentStyle: { backgroundColor: t.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="category/[id]"
        options={{ title: 'Категория', headerBackTitle: 'Назад' }}
      />
      <Stack.Screen
        name="lesson/[id]"
        options={{ title: 'Урок', headerBackTitle: 'Назад' }}
      />
      <Stack.Screen
        name="mnd-exercise/[id]"
        options={{ title: 'Упражнение', headerBackTitle: 'Назад' }}
      />
    </Stack>
  );
}
