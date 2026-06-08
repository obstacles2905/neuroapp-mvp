'use client';

import { enqueueMediaUpload } from '@/lib/media/enqueue-media-upload';
import type { UploadMediaResult } from '@/lib/api/upload-media';
import { useMediaUploadStore } from '@/lib/stores/media-upload-store';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

export type MediaUploadContext = {
  returnPath: string;
  onPersist?: (result: UploadMediaResult) => Promise<void>;
};

type MediaUploadFieldProps = {
  folder: 'videos' | 'animations' | 'lessons';
  label: string;
  onUploaded: (s3Key: string, url: string) => void;
  disabled?: boolean;
  uploadContext?: MediaUploadContext;
};

export function MediaUploadField({
  folder,
  label,
  onUploaded,
  disabled,
  uploadContext,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const activeUploads = useMediaUploadStore((state) =>
    state.jobs.filter((job) => job.status === 'uploading').length,
  );

  function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    if (!uploadContext) {
      return;
    }

    enqueueMediaUpload({
      file,
      folder,
      returnPath: uploadContext.returnPath,
      onLocalSuccess: (result) => onUploaded(result.s3Key, result.url),
      onPersist: uploadContext.onPersist,
    });

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  const queueLabel =
    activeUploads > 0 ? `${label} (${activeUploads} в фоне)` : label;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*,.json,.lottie"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onFile(e.target.files)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {queueLabel}
        </Button>
        {activeUploads > 0 ? (
          <span className="text-xs text-muted-foreground">
            Загрузка идёт в фоне — можно уйти со страницы.
          </span>
        ) : null}
      </div>
    </div>
  );
}
