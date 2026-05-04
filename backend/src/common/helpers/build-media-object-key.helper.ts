import { randomUUID } from 'crypto';
import { sanitizeUploadFileName } from './sanitize-upload-file-name.helper';

export function buildMediaObjectKey(
  originalName: string,
  folder?: string,
): string {
  const safeName = sanitizeUploadFileName(originalName);
  const unique = `${Date.now()}-${randomUUID()}-${safeName}`;
  if (!folder || folder.trim().length === 0) {
    return unique;
  }
  const normalized = folder.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
  return `${normalized}/${unique}`;
}
