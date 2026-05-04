import type { ConfigService } from '@nestjs/config';
import { S3_ENV_KEYS } from '../constants/s3-env-keys.constant';

export function resolveS3PublicUrl(
  configService: ConfigService,
  objectKey: string,
): string {
  const configuredBase = configService
    .get<string>(S3_ENV_KEYS.PUBLIC_BASE_URL)
    ?.replace(/\/+$/, '');
  if (configuredBase && configuredBase.length > 0) {
    return `${configuredBase}/${objectKey}`;
  }

  const endpoint = configService
    .getOrThrow<string>(S3_ENV_KEYS.ENDPOINT)
    .replace(/\/+$/, '');
  const bucket = configService.getOrThrow<string>(S3_ENV_KEYS.BUCKET);
  return `${endpoint}/${bucket}/${objectKey}`;
}
