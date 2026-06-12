export type UploadMediaResult = {
  s3Key: string;
  url: string;
  deduplicated?: boolean;
};

export type UploadLessonMediaInput = {
  file: File;
  folder: 'videos' | 'animations' | 'architect-word';
};

export type PresignMediaUploadPayload = {
  originalName: string;
  contentType: string;
  fileSize: number;
  folder: UploadLessonMediaInput['folder'];
};

type PresignMediaUploadResult = UploadMediaResult & {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  deduplicated?: boolean;
};

async function requestPresign(
  input: UploadLessonMediaInput,
): Promise<PresignMediaUploadResult> {
  const payload: PresignMediaUploadPayload = {
    originalName: input.file.name,
    contentType: input.file.type || 'application/octet-stream',
    fileSize: input.file.size,
    folder: input.folder,
  };

  const response = await fetch('/api/media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = (await response.text()).trim();
    throw new Error(text || `Не удалось подготовить загрузку (${response.status})`);
  }

  return response.json() as Promise<PresignMediaUploadResult>;
}

const UPLOAD_TIMEOUT_MS = 30 * 60 * 1000;

function formatStorageUploadError(status: number, body: string): string {
  if (status === 403 && presignLooksLikeLocalMinio()) {
    return (
      'Хранилище отклонило загрузку (403). Для локального MinIO в backend/.env ' +
      'нужны S3_ACCESS_KEY=minioadmin и S3_SECRET_KEY=minioadmin, не AWS-ключи.'
    );
  }
  if (status === 403) {
    return (
      body ||
      'Хранилище отклонило загрузку (403). Проверьте S3_ACCESS_KEY / S3_SECRET_KEY и S3_ENDPOINT.'
    );
  }
  return (
    body ||
    `Загрузка в хранилище не удалась (${status}). Проверьте CORS бакета S3.`
  );
}

function presignLooksLikeLocalMinio(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export async function uploadLessonMedia(
  input: UploadLessonMediaInput,
): Promise<UploadMediaResult> {
  const presign = await requestPresign(input);
  if (presign.deduplicated === true) {
    return {
      s3Key: presign.s3Key,
      url: presign.url,
      deduplicated: true,
    };
  }
  const uploadResponse = await fetch(presign.uploadUrl, {
    method: presign.method,
    headers: presign.headers,
    body: input.file,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });

  if (!uploadResponse.ok) {
    const text = (await uploadResponse.text()).trim();
    throw new Error(formatStorageUploadError(uploadResponse.status, text));
  }

  return { s3Key: presign.s3Key, url: presign.url };
}
