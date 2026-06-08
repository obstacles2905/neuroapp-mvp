'use client';

import { useMediaUploadStore } from '@/lib/stores/media-upload-store';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const INFO_DISMISS_MS = 5000;
const RESULT_DISMISS_MS = 12000;

type ToastItemProps = {
  id: string;
  variant: 'info' | 'success' | 'error';
  title: string;
  message: string;
  returnPath?: string;
  onDismiss: (id: string) => void;
};

function MediaUploadToastItem({
  id,
  variant,
  title,
  message,
  returnPath,
  onDismiss,
}: ToastItemProps) {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const clickable = variant !== 'info' && Boolean(returnPath);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const delay = variant === 'info' ? INFO_DISMISS_MS : RESULT_DISMISS_MS;
    const timer = window.setTimeout(() => onDismiss(id), delay);
    return () => window.clearTimeout(timer);
  }, [id, onDismiss, variant]);

  function handleNavigate(): void {
    if (!returnPath) {
      return;
    }
    onDismiss(id);
    router.push(returnPath);
  }

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-[min(22rem,calc(100vw-2rem))] gap-2 rounded-lg border px-3 py-2.5 shadow-lg transition-[transform,opacity] duration-200 ease-out',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        variant === 'info' &&
          'border-sky-400/50 bg-sky-600 text-sky-50 dark:border-sky-500/40 dark:bg-sky-950',
        variant === 'success' &&
          'border-emerald-400/50 bg-emerald-600 text-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950',
        variant === 'error' &&
          'border-red-400/50 bg-red-600 text-red-50 dark:border-red-500/40 dark:bg-red-950',
        clickable && 'cursor-pointer hover:brightness-105',
      )}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      onClick={clickable ? handleNavigate : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleNavigate();
              }
            }
          : undefined
      }
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{title}</p>
        {message ? (
          <p className="mt-0.5 line-clamp-4 whitespace-pre-wrap text-xs leading-snug text-white/90">
            {message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDismiss(id);
        }}
        className="shrink-0 rounded-md p-0.5 opacity-80 outline-none ring-offset-2 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70"
        aria-label="Закрыть"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function MediaUploadToastHost() {
  const toasts = useMediaUploadStore((state) => state.toasts);
  const dismissToast = useMediaUploadStore((state) => state.dismissToast);
  const handleDismiss = useCallback(
    (id: string) => {
      dismissToast(id);
    },
    [dismissToast],
  );

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[110] flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <MediaUploadToastItem
          key={toast.id}
          id={toast.id}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          returnPath={toast.returnPath}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
}
