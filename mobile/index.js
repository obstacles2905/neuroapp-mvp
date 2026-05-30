import '@expo/metro-runtime';

import * as SplashScreen from 'expo-splash-screen';
import { Head } from 'expo-router/build/head';
import { ExpoRoot } from 'expo-router/build/ExpoRoot';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

import 'expo-router/build/fast-refresh';

void SplashScreen.hideAsync();

/** Web и прочие таргеты (как `expo-router/_ctx.web.js`). */
const ctx = require.context(
  './app',
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+middleware)|(?:\+(html|native-intent))))\.[tj]sx?$).*(?:\.android|\.ios|\.native)?\.[tj]sx?$/,
  'sync',
);

export function App() {
  return (
    <Head.Provider>
      <ExpoRoot context={ctx} />
    </Head.Provider>
  );
}

renderRootComponent(App);
