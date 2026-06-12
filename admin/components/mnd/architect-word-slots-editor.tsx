'use client';

import {
  clearArchitectWordSlotAction,
  upsertArchitectWordSlotAction,
} from '@/app/actions/architect-word';
import {
  MediaUploadField,
  type MediaUploadContext,
} from '@/components/lesson-builder/media-upload-field';
import { AdminVideoPreview } from '@/components/media/admin-video-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ArchitectWordAdminSlot } from '@/lib/types/architect-word';
import { useCallback, useMemo, useState } from 'react';

type ArchitectWordSlotsEditorProps = {
  symptomId: string;
  initialSlots: ArchitectWordAdminSlot[];
};

export function ArchitectWordSlotsEditor({
  symptomId,
  initialSlots,
}: ArchitectWordSlotsEditorProps) {
  const [slots, setSlots] = useState(initialSlots);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persistSlot = useCallback(
    async (
      slot: number,
      payload: { s3Key?: string; isPublished?: boolean },
    ): Promise<void> => {
      setBusySlot(slot);
      setError(null);
      try {
        const updated = await upsertArchitectWordSlotAction(
          symptomId,
          slot,
          payload,
        );
        setSlots((prev) =>
          prev.map((row) => (row.slot === slot ? updated : row)),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Не удалось сохранить';
        setError(message);
      } finally {
        setBusySlot(null);
      }
    },
    [symptomId],
  );

  const onClear = useCallback(
    async (slot: number): Promise<void> => {
      setBusySlot(slot);
      setError(null);
      try {
        await clearArchitectWordSlotAction(symptomId, slot);
        setSlots((prev) =>
          prev.map((row) =>
            row.slot === slot
              ? {
                  slot,
                  id: null,
                  s3Key: null,
                  mediaUrl: null,
                  isPublished: false,
                }
              : row,
          ),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Не удалось очистить';
        setError(message);
      } finally {
        setBusySlot(null);
      }
    },
    [symptomId],
  );

  return (
    <div className="space-y-4">
      {error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : null}
      {slots.map((row) => (
        <SlotCard
          key={row.slot}
          row={row}
          symptomId={symptomId}
          busy={busySlot === row.slot}
          onPersist={persistSlot}
          onClear={onClear}
        />
      ))}
    </div>
  );
}

function SlotCard({
  row,
  symptomId,
  busy,
  onPersist,
  onClear,
}: {
  row: ArchitectWordAdminSlot;
  symptomId: string;
  busy: boolean;
  onPersist: (
    slot: number,
    payload: { s3Key?: string; isPublished?: boolean },
  ) => Promise<void>;
  onClear: (slot: number) => Promise<void>;
}) {
  const uploadContext = useMemo<MediaUploadContext>(
    () => ({
      returnPath: `/mnd/symptoms/${symptomId}/architect-word`,
      onPersist: async (result) => {
        await onPersist(row.slot, { s3Key: result.s3Key });
      },
    }),
    [onPersist, row.slot, symptomId],
  );

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          Слот {row.slot}
        </h3>
        <Badge variant={row.isPublished ? 'default' : 'secondary'}>
          {row.isPublished ? 'Опубликован' : 'Черновик'}
        </Badge>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            s3_key
          </label>
          <input
            className="input-admin font-mono text-xs"
            value={row.s3Key ?? ''}
            readOnly
            placeholder="architect-word/…"
          />
        </div>
        <MediaUploadField
          folder="architect-word"
          label="Загрузить видео"
          disabled={busy}
          uploadContext={uploadContext}
          onUploaded={(s3Key) => {
            void onPersist(row.slot, { s3Key });
          }}
        />
        {row.mediaUrl ? (
          <AdminVideoPreview url={row.mediaUrl} />
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={row.isPublished}
            disabled={busy || !row.s3Key}
            onChange={(e) => {
              void onPersist(row.slot, { isPublished: e.target.checked });
            }}
          />
          Опубликовать для приложения
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || row.s3Key == null}
          onClick={() => {
            void onClear(row.slot);
          }}
        >
          Очистить слот
        </Button>
      </div>
    </div>
  );
}
