import { sanitizeUploadFileName } from './sanitize-upload-file-name.helper';

/**
 * Стабильный ключ объекта: `folder/safe-file-name.ext`.
 * Используется для дедупликации загрузок по имени файла.
 */
export function buildStableMediaObjectKey(
  originalName: string,
  folder?: string,
): string {
  const safeName = sanitizeUploadFileName(originalName);
  if (folder == null || folder.trim().length === 0) {
    return safeName;
  }
  const normalized = folder.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
  return `${normalized}/${safeName}`;
}

/** Суффикс legacy-ключей: `timestamp-uuid-safeName`. */
export function legacyMediaObjectKeySuffix(safeName: string): string {
  return `-${safeName}`;
}
