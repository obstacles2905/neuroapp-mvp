import { AuthProvider } from '@/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemeProvider } from '@react-navigation/native';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useNavigationThemeMerged, useAppTheme } from '@/hooks/useAppTheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Сплэш не должен блокировать UI: блокирующая загрузка FontAwesome + всех файлов может «висеть» на части Android.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
    void (async () => {
      try {
        await Font.loadAsync({
          SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
          ...FontAwesome.font,
        });
      } catch (e) {
        if (__DEV__) {
          console.warn('[fonts] Font.loadAsync failed:', e);
        }
      }
    })().catch(() => undefined);
  }, []);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const navTheme = useNavigationThemeMerged();
  const palette = useAppTheme();

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <StatusBar style={palette.statusBarStyle} />
          <Stack
          screenOptions={{
            contentStyle: { backgroundColor: palette.background },
            headerTintColor: palette.tint,
            headerStyle: {
              backgroundColor: palette.surface,
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
