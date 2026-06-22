import { SessionBriefingFlow } from '@/features/session-briefing/SessionBriefingFlow';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import {
  completeSessionBriefing,
  fetchSessionBriefingPresentation,
} from '@/lib/api/session-briefing';
import type { SessionBriefingSlide } from '@/lib/api/types/session-briefing.types';
import { getSessionContinuationHref } from '@/lib/navigation/session-continuation';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

export default function SessionFinalWordScreen(): React.JSX.Element {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [slide, setSlide] = useState<SessionBriefingSlide | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSessionBriefingPresentation('final-word');
        if (!cancelled) {
          setSlide(data.slide);
        }
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить видео.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onFinish = useCallback(async (): Promise<void> => {
    setError(null);
    setSubmitting(true);
    try {
      await completeSessionBriefing('final-word');
      const me = await refreshUser();
      router.replace(
        me != null ? getSessionContinuationHref(me) : ('/(app)/(tabs)' as Href),
      );
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'Не удалось завершить. Повторите.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [refreshUser, router]);

  return (
    <SessionBriefingFlow
      title="Финальное слово"
      description="Итоговое обращение перед началом работы с программой."
      emptyMessage="Видео скоро появится. Нажмите «Дальше», чтобы войти в приложение."
      slide={slide}
      loading={loading}
      submitting={submitting}
      error={error}
      onFinish={onFinish}
      finishLabel="Продолжить в приложение"
    />
  );
}
