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
        name="mnd-exercise/[id]"
        options={{ title: 'Упражнение', headerBackTitle: 'Назад' }}
      />
      <Stack.Screen
        name="session-greeting"
        options={{ title: 'Приветствие', headerBackVisible: false }}
      />
      <Stack.Screen
        name="architect-word"
        options={{ title: 'Слово Архитектора', headerBackTitle: 'Назад' }}
      />
      <Stack.Screen
        name="session-final-word"
        options={{ title: 'Финальное слово', headerBackVisible: false }}
      />
    </Stack>
  );
}
