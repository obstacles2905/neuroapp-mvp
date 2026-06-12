import { ArchitectWordFlow } from '@/features/architect-word/ArchitectWordFlow';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import {
  completeArchitectWord,
  fetchArchitectWordPresentation,
} from '@/lib/api/architect-word';
import type { ArchitectWordSlide } from '@/lib/api/types/architect-word.types';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

export default function ArchitectWordScreen(): React.JSX.Element {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const params = useLocalSearchParams<{ replay?: string }>();
  const replay = params.replay === '1' || params.replay === 'true';

  const [slides, setSlides] = useState<ArchitectWordSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchArchitectWordPresentation({ replay });
        if (!cancelled) {
          setSlides(data.slides);
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
  }, [replay]);

  const onFinish = useCallback(async (): Promise<void> => {
    setError(null);
    setSubmitting(true);
    try {
      if (!replay) {
        await completeArchitectWord();
        await refreshUser();
      }
      router.back();
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'Не удалось завершить. Повторите.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [replay, refreshUser, router]);

  const onFinishToTabs = useCallback(async (): Promise<void> => {
    setError(null);
    setSubmitting(true);
    try {
      if (!replay) {
        await completeArchitectWord();
        await refreshUser();
      }
      router.replace('/(app)/(tabs)' as Href);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'Не удалось завершить. Повторите.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [replay, refreshUser, router]);

  return (
    <ArchitectWordFlow
      slides={slides}
      loading={loading}
      submitting={submitting}
      error={error}
      onFinish={replay ? onFinish : onFinishToTabs}
      finishLabel={replay ? 'Готово' : 'Продолжить в приложение'}
    />
  );
}
