export const MEDIA_UPLOAD_FOLDERS = [
  'videos',
  'animations',
  'lessons',
] as const;

export type MediaUploadFolder =
  (typeof MEDIA_UPLOAD_FOLDERS)[number];
