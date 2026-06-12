export function isS3NotFoundError(error: unknown): boolean {
  if (error == null || typeof error !== 'object') {
    return false;
  }
  const record = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  if (record.name === 'NotFound' || record.name === 'NoSuchKey') {
    return true;
  }
  return record.$metadata?.httpStatusCode === 404;
}
