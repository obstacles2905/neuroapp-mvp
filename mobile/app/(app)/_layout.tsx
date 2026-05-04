import { Stack } from 'expo-router';

export default function AppGroupLayout(): React.JSX.Element {
  return (
    <Stack>
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
