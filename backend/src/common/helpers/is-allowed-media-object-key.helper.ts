import { APP_MEDIA_ALLOWED_PREFIXES } from '../constants/app-media-stream.constant';

export function isAllowedMediaObjectKey(objectKey: string): boolean {
  if (objectKey.length === 0 || objectKey.includes('..')) {
    return false;
  }
  return APP_MEDIA_ALLOWED_PREFIXES.some((prefix) => objectKey.startsWith(prefix));
}
