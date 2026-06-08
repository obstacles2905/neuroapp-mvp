import type { ConfigService } from '@nestjs/config';
import { S3_ENV_KEYS } from '../constants/s3-env-keys.constant';

const AWS_VIRTUAL_HOSTED_RE =
  /^https?:\/\/([a-z0-9.-]+)\.s3[.-]([a-z0-9-]+)\.amazonaws\.com\/?$/i;

function normalizeEndpoint(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveAwsRegionalEndpoint(region: string): string {
  return `https://s3.${region}.amazonaws.com`;
}

function resolveFromPublicBaseUrl(
  publicBase: string,
  bucket: string,
): string | null {
  const bucketSuffix = `/${bucket}`;
  if (publicBase.endsWith(bucketSuffix)) {
    return publicBase.slice(0, -bucketSuffix.length);
  }

  const virtualHostedMatch = AWS_VIRTUAL_HOSTED_RE.exec(publicBase);
  if (virtualHostedMatch !== null) {
    const hostBucket = virtualHostedMatch[1];
    const region = virtualHostedMatch[2];
    if (hostBucket === bucket && region.length > 0) {
      return resolveAwsRegionalEndpoint(region);
    }
  }

  return null;
}

export function resolveS3PresignEndpoint(
  configService: ConfigService,
): string {
  const explicit = configService
    .get<string>(S3_ENV_KEYS.PRESIGN_ENDPOINT)
    ?.trim();
  if (explicit && explicit.length > 0) {
    return normalizeEndpoint(explicit);
  }

  const configuredEndpoint = configService
    .get<string>(S3_ENV_KEYS.ENDPOINT)
    ?.trim();
  if (configuredEndpoint && configuredEndpoint.length > 0) {
    return normalizeEndpoint(configuredEndpoint);
  }

  const publicBase = configService
    .get<string>(S3_ENV_KEYS.PUBLIC_BASE_URL)
    ?.replace(/\/+$/, '');
  if (publicBase && publicBase.length > 0) {
    const bucket = configService.getOrThrow<string>(S3_ENV_KEYS.BUCKET);
    const derived = resolveFromPublicBaseUrl(publicBase, bucket);
    if (derived !== null) {
      return normalizeEndpoint(derived);
    }
    return new URL(publicBase).origin;
  }

  const region = configService.get<string>(S3_ENV_KEYS.REGION, 'us-east-1');
  return resolveAwsRegionalEndpoint(region);
}
