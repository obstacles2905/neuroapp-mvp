'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type AdminVideoPreviewProps = {
  url: string;
  label?: string;
  className?: string;
};

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AdminVideoPreview({
  url,
  label = 'Превью загруженного ролика',
  className,
}: AdminVideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setIsLoaded(false);
    setIsPlaying(false);
    setLoadFailed(false);
    setCurrentTime(0);
    setDuration(0);
  }, [url]);

  const togglePlayback = useCallback(async () => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }
    if (video.paused) {
      await video.play();
      return;
    }
    video.pause();
  }, []);

  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video == null) {
      return;
    }
    setCurrentTime(video.currentTime);
    if (Number.isFinite(video.duration)) {
      setDuration(video.duration);
    }
  }, []);

  const onSeek = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video == null || duration <= 0) {
      return;
    }
    const next = Number.parseFloat(event.target.value);
    video.currentTime = next;
    setCurrentTime(next);
  }, [duration]);

  if (loadFailed) {
    return (
      <div
        className={cn(
          'max-w-md rounded-xl border border-dashed border-border bg-muted/40 p-4',
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">
          Не удалось воспроизвести превью в браузере.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'mt-3 inline-flex',
          )}
        >
          Открыть файл
        </a>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn('w-full max-w-md', className)}>
      <div className="overflow-hidden rounded-xl border border-border/80 bg-slate-950 shadow-sm">
        <div className="relative aspect-video w-full">
          <video
            ref={videoRef}
            key={url}
            className="absolute inset-0 h-full w-full object-contain"
            src={url}
            playsInline
            preload="metadata"
            onLoadedData={() => setIsLoaded(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={onTimeUpdate}
            onDurationChange={onTimeUpdate}
            onError={() => setLoadFailed(true)}
          />

          {!isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            </div>
          ) : null}

          {isLoaded && !isPlaying ? (
            <button
              type="button"
              className="absolute inset-x-0 top-0 bottom-10 z-[1] flex flex-col items-center justify-center gap-2 bg-slate-950/35 transition hover:bg-slate-950/45"
              onClick={() => {
                void togglePlayback();
              }}
              aria-label="Воспроизвести"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <Play className="ml-0.5 h-6 w-6 fill-current" />
              </span>
              <span className="text-xs font-medium text-white/90">
                Нажмите для воспроизведения
              </span>
            </button>
          ) : null}

          {isLoaded ? (
            <div className="absolute inset-x-0 bottom-0 z-[2] flex items-center gap-2 bg-slate-950/90 px-2.5 py-2">
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/10"
                onClick={() => {
                  void togglePlayback();
                }}
                aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 0}
                step={0.1}
                value={currentTime}
                onChange={onSeek}
                className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/25 accent-primary"
                aria-label="Позиция воспроизведения"
              />
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/85">
                {formatTime(currentTime)}
                {duration > 0 ? ` / ${formatTime(duration)}` : ''}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {label.length > 0 ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
