'use client';

import { uploadLessonMediaAction } from '@/app/actions/lesson-steps';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { useRef, useState } from 'react';

type MediaUploadFieldProps = {
  folder: 'videos' | 'animations' | 'lessons';
  label: string;
  onUploaded: (s3Key: string, url: string) => void;
  disabled?: boolean;
};

export function MediaUploadField({
  folder,
  label,
  onUploaded,
  disabled,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const { feedback, notify } = useFeedbackToast();

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }
    setPending(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const result = await uploadLessonMediaAction(fd);
      onUploaded(result.s3Key, result.url);
      notify({
        variant: 'success',
        title: 'Файл загружен',
        message: `Ключ в хранилище:\n${result.s3Key}`,
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Загрузка не удалась',
        message: e instanceof Error ? e.message : 'Попробуйте другой файл или позже.',
      });
    } finally {
      setPending(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }

  return (
    <div className="space-y-2">
      {feedback}
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*,.json,.lottie"
        className="sr-only"
        disabled={disabled || pending}
        onChange={(e) => void onFile(e.target.files)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? 'Загрузка…' : label}
        </Button>
      </div>
    </div>
  );
}
