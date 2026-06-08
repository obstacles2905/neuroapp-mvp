import { ConfigService } from '@nestjs/config';
import { S3_ENV_KEYS } from '../constants/s3-env-keys.constant';
import { resolveS3PresignEndpoint } from './resolve-s3-presign-endpoint.helper';

function buildConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string, defaultValue?: string): string | undefined => {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return values[key];
      }
      return defaultValue;
    },
    getOrThrow: (key: string): string => {
      const value = values[key];
      if (value === undefined || value.length === 0) {
        throw new Error(`missing ${key}`);
      }
      return value;
    },
  } as ConfigService;
}

describe('resolveS3PresignEndpoint', () => {
  it('prefers explicit S3_PRESIGN_ENDPOINT', () => {
    const endpoint = resolveS3PresignEndpoint(
      buildConfig({
        [S3_ENV_KEYS.PRESIGN_ENDPOINT]: 'https://s3.eu-north-1.amazonaws.com',
        [S3_ENV_KEYS.PUBLIC_BASE_URL]:
          'https://neuroapp-media.s3.eu-north-1.amazonaws.com',
        [S3_ENV_KEYS.BUCKET]: 'neuroapp-media',
      }),
    );

    expect(endpoint).toBe('https://s3.eu-north-1.amazonaws.com');
  });

  it('derives regional endpoint from AWS virtual-hosted public base url', () => {
    const endpoint = resolveS3PresignEndpoint(
      buildConfig({
        [S3_ENV_KEYS.PUBLIC_BASE_URL]:
          'https://neuroapp-media.s3.eu-north-1.amazonaws.com',
        [S3_ENV_KEYS.BUCKET]: 'neuroapp-media',
        [S3_ENV_KEYS.REGION]: 'eu-north-1',
      }),
    );

    expect(endpoint).toBe('https://s3.eu-north-1.amazonaws.com');
  });

  it('derives minio endpoint from path-style public base url', () => {
    const endpoint = resolveS3PresignEndpoint(
      buildConfig({
        [S3_ENV_KEYS.PUBLIC_BASE_URL]:
          'http://localhost:9000/neuro-sync-media',
        [S3_ENV_KEYS.BUCKET]: 'neuro-sync-media',
      }),
    );

    expect(endpoint).toBe('http://localhost:9000');
  });
});
