import type { ConfigService } from '@nestjs/config';
import { S3_ENV_KEYS } from '../constants/s3-env-keys.constant';

export function resolveS3PresignEndpoint(
  configService: ConfigService,
): string {
  const explicit = configService
    .get<string>(S3_ENV_KEYS.PRESIGN_ENDPOINT)
    ?.trim();
  if (explicit && explicit.length > 0) {
    return explicit.replace(/\/+$/, '');
  }

  const publicBase = configService
    .get<string>(S3_ENV_KEYS.PUBLIC_BASE_URL)
    ?.replace(/\/+$/, '');
  if (publicBase && publicBase.length > 0) {
    const bucket = configService.getOrThrow<string>(S3_ENV_KEYS.BUCKET);
    const bucketSuffix = `/${bucket}`;
    if (publicBase.endsWith(bucketSuffix)) {
      return publicBase.slice(0, -bucketSuffix.length);
    }
    return new URL(publicBase).origin;
  }

  return configService
    .getOrThrow<string>(S3_ENV_KEYS.ENDPOINT)
    .replace(/\/+$/, '');
}
