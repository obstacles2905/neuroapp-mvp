'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

const AUTO_DISMISS_MS = 4800;

export type FeedbackPayload = {
  variant: 'success' | 'error';
  title: string;
  message: string;
};

type FeedbackToastProps = FeedbackPayload & {
  open: boolean;
  onClose: () => void;
};

export function FeedbackToast({
  open,
  variant,
  title,
  message,
  onClose,
}: FeedbackToastProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const t = window.setTimeout(onClose, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        'pointer-events-auto fixed bottom-4 right-4 z-[100] flex w-[min(20rem,calc(100vw-2rem))] gap-2 rounded-lg border px-3 py-2.5 shadow-lg transition-[transform,opacity] duration-200 ease-out sm:bottom-6 sm:right-6',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        variant === 'success' &&
          'border-emerald-400/50 bg-emerald-600 text-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950 dark:text-emerald-50',
        variant === 'error' &&
          'border-red-400/50 bg-red-600 text-red-50 dark:border-red-500/40 dark:bg-red-950 dark:text-red-50',
      )}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{title}</p>
        {message ? (
          <p className="mt-0.5 line-clamp-4 whitespace-pre-wrap text-xs leading-snug text-white/90 dark:text-white/85">
            {message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md p-0.5 opacity-80 outline-none ring-offset-2 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70"
        aria-label="Закрыть"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function useFeedbackToast(): {
  feedback: ReactNode;
  notify: (payload: FeedbackPayload) => void;
  dismiss: () => void;
} {
  const [payload, setPayload] = useState<FeedbackPayload | null>(null);

  const dismiss = useCallback(() => {
    setPayload(null);
  }, []);

  const notify = useCallback((p: FeedbackPayload) => {
    setPayload(p);
  }, []);

  const feedback = (
    <FeedbackToast
      open={payload !== null}
      variant={payload?.variant ?? 'success'}
      title={payload?.title ?? ''}
      message={payload?.message ?? ''}
      onClose={dismiss}
    />
  );

  return { feedback, notify, dismiss };
}
