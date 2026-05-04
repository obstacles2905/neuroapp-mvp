import { darkTokens, lightTokens } from '@/constants/theme';

/**
 * Совместимость с `components/Themed.tsx` и таб-баром.
 * Предпочтительнее брать полный набор через `hooks/useAppTheme`.
 */
export default {
  light: {
    text: lightTokens.text,
    background: lightTokens.background,
    tint: lightTokens.tint,
    tabIconDefault: lightTokens.tabIconDefault,
    tabIconSelected: lightTokens.tabIconSelected,
  },
  dark: {
    text: darkTokens.text,
    background: darkTokens.background,
    tint: darkTokens.tint,
    tabIconDefault: darkTokens.tabIconDefault,
    tabIconSelected: darkTokens.tabIconSelected,
  },
};
