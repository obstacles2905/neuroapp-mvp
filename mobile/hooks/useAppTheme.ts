import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from '@react-navigation/native';
import { useMemo } from 'react';

import {
  buildReactNavigationColors,
  type AppTokens,
  type ColorSchemeName,
  getTokens,
} from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

function resolveScheme(system: string | undefined | null): ColorSchemeName {
  return system === 'dark' ? 'dark' : 'light';
}

export function useAppTheme(): AppTokens {
  const scheme = useColorScheme();
  return useMemo(
    () => getTokens(resolveScheme(scheme ?? 'light')),
    [scheme],
  );
}

export function useResolvedColorScheme(): ColorSchemeName {
  const scheme = useColorScheme();
  return resolveScheme(scheme ?? 'light');
}

export function useNavigationThemeColors() {
  const t = useAppTheme();
  return useMemo(() => buildReactNavigationColors(t), [t]);
}

export function useNavigationThemeMerged(): Theme {
  const resolved = useResolvedColorScheme();
  const t = useAppTheme();
  return useMemo(() => {
    const base = resolved === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        ...buildReactNavigationColors(t),
      },
      dark: resolved === 'dark',
    };
  }, [resolved, t]);
}
