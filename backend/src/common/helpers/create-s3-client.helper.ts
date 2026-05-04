import { S3Client } from '@aws-sdk/client-s3';
import type { ConfigService } from '@nestjs/config';
import { S3_ENV_KEYS } from '../constants/s3-env-keys.constant';

export function createS3ClientFromConfig(
  configService: ConfigService,
): S3Client {
  const forcePathStyle =
    configService.get<string>(S3_ENV_KEYS.FORCE_PATH_STYLE, 'true') === 'true';
  return new S3Client({
    region: configService.get<string>(S3_ENV_KEYS.REGION, 'us-east-1'),
    endpoint: configService.get<string>(S3_ENV_KEYS.ENDPOINT),
    credentials: {
      accessKeyId: configService.getOrThrow<string>(S3_ENV_KEYS.ACCESS_KEY),
      secretAccessKey: configService.getOrThrow<string>(S3_ENV_KEYS.SECRET_KEY),
    },
    forcePathStyle,
  });
}
