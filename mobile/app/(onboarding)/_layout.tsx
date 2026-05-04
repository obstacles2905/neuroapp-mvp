import { Stack } from 'expo-router';

export default function OnboardingLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: 'Онбординг',
      }}
    />
  );
}
