import { uploadLessonMedia } from '@/lib/api/upload-media';
import { useMediaUploadStore } from '@/lib/stores/media-upload-store';
import type { EnqueueMediaUploadInput } from '@/lib/types/media-upload-job';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function createJobId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `upload-${Date.now()}`;
}

export function enqueueMediaUpload(input: EnqueueMediaUploadInput): string {
  const jobId = createJobId();
  const store = useMediaUploadStore.getState();

  store.addJob({
    id: jobId,
    fileName: input.file.name,
    folder: input.folder,
    status: 'uploading',
    returnPath: input.returnPath,
    createdAt: Date.now(),
  });

  store.pushToast({
    id: `${jobId}-started`,
    variant: 'info',
    title: 'Загрузка начата',
    message: `${input.file.name} (${formatFileSize(input.file.size)}). Можно продолжать работу — сообщим, когда файл будет в S3.`,
  });

  void runMediaUpload(jobId, input);
  return jobId;
}

async function runMediaUpload(
  jobId: string,
  input: EnqueueMediaUploadInput,
): Promise<void> {
  const store = useMediaUploadStore.getState();

  try {
    const result = await uploadLessonMedia({
      file: input.file,
      folder: input.folder,
    });

    input.onLocalSuccess?.(result);
    store.updateJob(jobId, {
      status: 'success',
      result,
    });

    if (input.onPersist) {
      await input.onPersist(result);
    }
    const doneTitle = result.deduplicated
      ? 'Файл уже в S3'
      : input.folder === 'videos'
        ? 'Видео загружено'
        : input.folder === 'architect-word'
          ? 'Видео «Слово Архитектора» загружено'
          : 'Файл загружен';
    const doneMessage = result.deduplicated
      ? `${input.file.name} — использован существующий объект в хранилище.`
      : `${input.file.name} сохранён в S3. Нажмите, чтобы вернуться к уроку.`;
    store.pushToast({
      id: `${jobId}-done`,
      variant: 'success',
      title: doneTitle,
      message: doneMessage,
      returnPath: input.returnPath,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Попробуйте другой файл или повторите позже.';

    store.updateJob(jobId, {
      status: 'error',
      errorMessage: message,
    });
    store.pushToast({
      id: `${jobId}-failed`,
      variant: 'error',
      title: 'Загрузка не удалась',
      message: `${input.file.name}: ${message}`,
      returnPath: input.returnPath,
    });
  }
}
