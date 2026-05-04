/**
 * Дизайн-токены Neuro: светлая палитра (теплый нейтральный фон) и тёмная тема.
 * Акцент — бирюза/сине-зелёный для спокойного «wellness» характера.
 */
export type ColorSchemeName = 'light' | 'dark';

export type AppTokens = Readonly<{
  /** Основной фон экрана */
  background: string;
  /** Второй слой (подложка под блоки) */
  backgroundMuted: string;
  /** Карточки и панели */
  surface: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  tint: string;
  tintMuted: string;
  tintForeground: string;
  link: string;
  success: string;
  successMuted: string;
  successSurface: string;
  error: string;
  errorSurface: string;
  warningSurface: string;
  warningBorder: string;
  warningText: string;
  tabIconDefault: string;
  tabIconSelected: string;
  /** Соответствует `style` из `expo-status-bar`: `dark` — тёмные иконки на светлом фоне. */
  statusBarStyle: 'light' | 'dark';
  /** Полупрозрачная подложка модалки */
  scrim: string;
}>;

export const lightTokens: AppTokens = {
  background: '#F4F6F8',
  backgroundMuted: '#E8ECF1',
  surface: '#FFFFFF',
  surfaceHover: '#FAFBFD',
  border: '#DFE5ED',
  borderSubtle: '#EEF2F7',
  text: '#101828',
  textSecondary: '#475467',
  textMuted: '#667085',
  textInverse: '#FFFFFF',
  tint: '#0D9488',
  tintMuted: '#CCFBF1',
  tintForeground: '#FFFFFF',
  link: '#0F766E',
  success: '#059669',
  successMuted: '#047857',
  successSurface: '#ECFDF5',
  error: '#DC2626',
  errorSurface: '#FEF2F2',
  warningSurface: '#FFFBEB',
  warningBorder: '#FDE68A',
  warningText: '#92400E',
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#0D9488',
  statusBarStyle: 'dark',
  scrim: 'rgba(15, 23, 42, 0.55)',
};

export const darkTokens: AppTokens = {
  background: '#0B1220',
  backgroundMuted: '#111A2E',
  surface: '#151D2F',
  surfaceHover: '#1C273C',
  border: '#2D3D55',
  borderSubtle: '#1F2A3D',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textInverse: '#0B1220',
  tint: '#2DD4BF',
  tintMuted: '#115E59',
  tintForeground: '#042F2E',
  link: '#5EEAD4',
  success: '#34D399',
  successMuted: '#6EE7B7',
  successSurface: '#064E3B',
  error: '#F87171',
  errorSurface: '#450A0A',
  warningSurface: '#422006',
  warningBorder: '#B45309',
  warningText: '#FBBF24',
  tabIconDefault: '#64748B',
  tabIconSelected: '#2DD4BF',
  statusBarStyle: 'light',
  scrim: 'rgba(0, 0, 0, 0.72)',
};

const themes: Record<ColorSchemeName, AppTokens> = {
  light: lightTokens,
  dark: darkTokens,
};

export function getTokens(scheme: ColorSchemeName): AppTokens {
  return themes[scheme];
}

export type NavigationThemeColors = Readonly<{
  primary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
}>;

/** Темы React Navigation синхронизированы с `AppTokens`. */
export function buildReactNavigationColors(
  t: AppTokens,
): NavigationThemeColors {
  return {
    primary: t.tint,
    background: t.background,
    card: t.surface,
    text: t.text,
    border: t.border,
    notification: t.tint,
  };
}
