export type UploadMediaResult = { s3Key: string; url: string };

export type UploadLessonMediaInput = {
  file: File;
  folder: 'videos' | 'animations' | 'lessons';
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

export async function uploadLessonMedia(
  input: UploadLessonMediaInput,
): Promise<UploadMediaResult> {
  const presign = await requestPresign(input);
  const uploadResponse = await fetch(presign.uploadUrl, {
    method: presign.method,
    headers: presign.headers,
    body: input.file,
  });

  if (!uploadResponse.ok) {
    const text = (await uploadResponse.text()).trim();
    throw new Error(
      text ||
        `Загрузка в хранилище не удалась (${uploadResponse.status}). Проверьте CORS бакета S3.`,
    );
  }

  return { s3Key: presign.s3Key, url: presign.url };
}
