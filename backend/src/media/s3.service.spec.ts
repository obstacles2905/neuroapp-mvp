import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PRESIGN_S3_CLIENT,
  S3_CLIENT,
} from '../common/constants/s3-client.token';
import { S3_ENV_KEYS } from '../common/constants/s3-env-keys.constant';
import { S3Service } from './s3.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

function notFoundError(): Error {
  const error = new Error('NotFound');
  error.name = 'NotFound';
  return error;
}

describe('S3Service', () => {
  let service: S3Service;
  const sendMock = jest.fn();
  const mockClient = { send: sendMock };
  const getSignedUrlMock = getSignedUrl as jest.MockedFunction<
    typeof getSignedUrl
  >;

  beforeEach(async () => {
    sendMock.mockReset();
    getSignedUrlMock.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: S3_CLIENT, useValue: mockClient },
        { provide: PRESIGN_S3_CLIENT, useValue: mockClient },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string): string => {
              if (key === S3_ENV_KEYS.BUCKET) {
                return 'test-bucket';
              }
              if (key === S3_ENV_KEYS.ENDPOINT) {
                return 'http://localhost:9000';
              }
              throw new Error(`unexpected ${key}`);
            },
            get: (key: string, defaultValue?: string): string | undefined => {
              if (key === S3_ENV_KEYS.PUBLIC_BASE_URL) {
                return 'http://localhost:9000/test-bucket';
              }
              return defaultValue;
            },
          },
        },
      ],
    }).compile();

    service = module.get(S3Service);
  });

  it('uploadFile sends PutObject with stable key when object is new', async () => {
    expect.assertions(5);
    sendMock.mockImplementation((command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        return Promise.reject(notFoundError());
      }
      if (command instanceof ListObjectsV2Command) {
        return Promise.resolve({ Contents: [] });
      }
      return Promise.resolve({});
    });
    const payload = Buffer.from('hello');
    const file = {
      originalname: 'clip.mp4',
      buffer: payload,
      mimetype: 'video/mp4',
    } as Express.Multer.File;

    const result = await service.uploadFile(file, 'videos');

    const putCalls = sendMock.mock.calls.filter(
      ([command]) => command instanceof PutObjectCommand,
    );
    expect(putCalls).toHaveLength(1);
    expect(result.s3Key).toBe('videos/clip.mp4');
    expect(result.deduplicated).toBe(false);
    expect(result.url.includes('videos/clip.mp4')).toBe(true);
    expect(sendMock).toHaveBeenCalled();
  });

  it('uploadFile reuses stable key without PutObject when object exists', async () => {
    expect.assertions(3);
    sendMock.mockImplementation((command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        return Promise.resolve({});
      }
      return Promise.resolve({});
    });
    const file = {
      originalname: 'clip.mp4',
      buffer: Buffer.from('hello'),
      mimetype: 'video/mp4',
    } as Express.Multer.File;

    const result = await service.uploadFile(file, 'videos');

    const putCalls = sendMock.mock.calls.filter(
      ([command]) => command instanceof PutObjectCommand,
    );
    expect(putCalls).toHaveLength(0);
    expect(result.s3Key).toBe('videos/clip.mp4');
    expect(result.deduplicated).toBe(true);
  });

  it('createPresignedUpload returns deduplicated response when legacy key exists', async () => {
    expect.assertions(4);
    sendMock.mockImplementation((command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        return Promise.reject(notFoundError());
      }
      if (command instanceof ListObjectsV2Command) {
        return Promise.resolve({
          Contents: [{ Key: 'videos/1710000000000-uuid-clip.mp4' }],
        });
      }
      return Promise.resolve({});
    });

    const result = await service.createPresignedUpload({
      originalName: 'clip.mp4',
      contentType: 'video/mp4',
      fileSize: 1024,
      folder: 'videos',
    });

    expect(getSignedUrlMock).not.toHaveBeenCalled();
    expect(result.deduplicated).toBe(true);
    expect(result.uploadUrl).toBe('');
    expect(result.s3Key).toBe('videos/1710000000000-uuid-clip.mp4');
  });

  it('createPresignedUpload returns signed PUT target for new file', async () => {
    expect.assertions(5);
    sendMock.mockImplementation((command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        return Promise.reject(notFoundError());
      }
      if (command instanceof ListObjectsV2Command) {
        return Promise.resolve({ Contents: [] });
      }
      return Promise.resolve({});
    });
    getSignedUrlMock.mockResolvedValue(
      'http://localhost:9000/test-bucket/videos/clip.mp4?sig=1',
    );

    const result = await service.createPresignedUpload({
      originalName: 'clip.mp4',
      contentType: 'video/mp4',
      fileSize: 1024,
      folder: 'videos',
    });

    expect(getSignedUrlMock).toHaveBeenCalledTimes(1);
    expect(result.method).toBe('PUT');
    expect(result.uploadUrl).toContain('clip.mp4');
    expect(result.s3Key).toBe('videos/clip.mp4');
    expect(result.headers['Content-Type']).toBe('video/mp4');
  });
});
