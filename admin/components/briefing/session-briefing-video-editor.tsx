'use client';

import {
  clearSessionBriefingAction,
  upsertSessionBriefingAction,
} from '@/app/actions/session-briefing';
import {
  MediaUploadField,
  type MediaUploadContext,
} from '@/components/lesson-builder/media-upload-field';
import { AdminVideoPreview } from '@/components/media/admin-video-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  SessionBriefingAdminVideo,
  SessionBriefingPhase,
} from '@/lib/types/session-briefing';
import { useCallback, useMemo, useState } from 'react';

type SessionBriefingVideoEditorProps = {
  phase: SessionBriefingPhase;
  initialVideo: SessionBriefingAdminVideo;
  mediaFolder: 'session-greeting' | 'session-final-word';
  returnPath: string;
};

export function SessionBriefingVideoEditor({
  phase,
  initialVideo,
  mediaFolder,
  returnPath,
}: SessionBriefingVideoEditorProps) {
  const [video, setVideo] = useState(initialVideo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(
    async (payload: { s3Key?: string; isPublished?: boolean }): Promise<void> => {
      setBusy(true);
      setError(null);
      try {
        const updated = await upsertSessionBriefingAction(phase, payload);
        setVideo(updated);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Не удалось сохранить';
        setError(message);
      } finally {
        setBusy(false);
      }
    },
    [phase],
  );

  const onClear = useCallback(async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await clearSessionBriefingAction(phase);
      setVideo({
        phase,
        id: null,
        s3Key: null,
        mediaUrl: null,
        isPublished: false,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось очистить';
      setError(message);
    } finally {
      setBusy(false);
    }
  }, [phase]);

  const uploadContext = useMemo<MediaUploadContext>(
    () => ({
      returnPath,
      onPersist: async (result) => {
        await persist({ s3Key: result.s3Key });
      },
    }),
    [persist, returnPath],
  );

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : null}
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Видео</h3>
          <Badge variant={video.isPublished ? 'default' : 'secondary'}>
            {video.isPublished ? 'Опубликовано' : 'Черновик'}
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              s3_key
            </label>
            <input
              className="input-admin font-mono text-xs"
              value={video.s3Key ?? ''}
              readOnly
              placeholder={`${mediaFolder}/…`}
            />
          </div>
          <MediaUploadField
            folder={mediaFolder}
            label="Загрузить видео"
            disabled={busy}
            uploadContext={uploadContext}
            onUploaded={(s3Key) => {
              void persist({ s3Key });
            }}
          />
          {video.mediaUrl ? <AdminVideoPreview url={video.mediaUrl} /> : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={video.isPublished}
              disabled={busy || !video.s3Key}
              onChange={(e) => {
                void persist({ isPublished: e.target.checked });
              }}
            />
            Опубликовать для приложения
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || video.s3Key == null}
            onClick={() => {
              void onClear();
            }}
          >
            Очистить видео
          </Button>
        </div>
      </div>
    </div>
  );
}
