import { Easing } from 'react-native';

/** Длительности переходов (ms) — единая шкала «лёгкого fade» по приложению. */
export const NAV_MOTION = {
  /** Смена контента bottom tabs */
  tabContentMs: 250,
  /** Подсветка активной иконки в tab bar */
  tabIconMs: 220,
  /** Урок, категория, упражнение — чуть быстрее tabs */
  stackFadeMs: 180,
  /** Корневой stack (auth → app и т.д.) */
  rootFadeMs: 200,
} as const;

export const tabTransitionSpec = {
  animation: 'timing' as const,
  config: {
    duration: NAV_MOTION.tabContentMs,
    easing: Easing.out(Easing.cubic),
  },
};
