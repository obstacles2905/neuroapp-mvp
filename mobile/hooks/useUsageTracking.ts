import { useAuth } from '@/contexts/AuthContext';
import {
  USAGE_FOREGROUND_KEY,
  usageTracker,
} from '@/lib/usage/usage-tracker';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

function syncForeground(active: boolean): void {
  if (active) {
    usageTracker.begin(USAGE_FOREGROUND_KEY, 'app', 'foreground');
    return;
  }
  usageTracker.end(USAGE_FOREGROUND_KEY);
  void usageTracker.flush();
}

/** Глобальный учёт времени в приложении (foreground). */
export function useUsageForegroundTracking(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      usageTracker.end(USAGE_FOREGROUND_KEY);
      return;
    }
    const onChange = (next: AppStateStatus): void => {
      syncForeground(next === 'active');
    };
    syncForeground(AppState.currentState === 'active');
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      sub.remove();
      usageTracker.end(USAGE_FOREGROUND_KEY);
      void usageTracker.flush();
    };
  }, [enabled]);
}

export function useUsageExerciseMndScreen(
  exerciseId: string | undefined,
): void {
  useEffect(() => {
    if (exerciseId == null || exerciseId.length === 0) {
      return;
    }
    const key = `${USAGE_FOREGROUND_KEY}:mnd:${exerciseId}`;
    usageTracker.begin(key, 'exercise', 'mnd_exercise', exerciseId);
    return () => {
      usageTracker.end(key);
      void usageTracker.flush();
    };
  }, [exerciseId]);
}

export function useUsageTrackingBootstrap(): void {
  const { isLoggedIn, isReady } = useAuth();
  useUsageForegroundTracking(isReady && isLoggedIn);
}
