export type UploadMediaResult = { s3Key: string; url: string };

export type UploadLessonMediaInput = {
  file: File;
  folder: 'videos' | 'animations' | 'lessons';
};

export async function uploadLessonMedia(
  input: UploadLessonMediaInput,
): Promise<UploadMediaResult> {
  const body = new FormData();
  body.append('file', input.file);
  body.append('folder', input.folder);

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    const text = (await response.text()).trim();
    throw new Error(text || `Загрузка не удалась (${response.status})`);
  }

  return response.json() as Promise<UploadMediaResult>;
}
