export function sanitizeUploadFileName(fileName: string): string {
  const baseName = fileName.replace(/^.*[/\\]/, '');
  const safe = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const trimmed = safe.length > 0 ? safe : 'file';
  return trimmed.length > 200 ? trimmed.slice(0, 200) : trimmed;
}
