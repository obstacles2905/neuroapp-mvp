import { PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { S3_CLIENT } from '../common/constants/s3-client.token';
import { S3_ENV_KEYS } from '../common/constants/s3-env-keys.constant';
import { S3Service } from './s3.service';

describe('S3Service', () => {
  let service: S3Service;
  const sendMock = jest.fn();
  const mockClient = { send: sendMock };

  beforeEach(async () => {
    sendMock.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: S3_CLIENT, useValue: mockClient },
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

  it('uploadFile sends PutObject and returns public url', async () => {
    expect.assertions(4);
    sendMock.mockResolvedValue({});
    const payload = Buffer.from('hello');
    const file = {
      originalname: 'clip.mp4',
      buffer: payload,
      mimetype: 'video/mp4',
    } as Express.Multer.File;

    const result = await service.uploadFile(file, 'videos');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const firstCall = sendMock.mock.calls[0] as unknown[] | undefined;
    const command = firstCall?.[0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(result.s3Key.startsWith('videos/')).toBe(true);
    expect(result.url.includes(result.s3Key)).toBe(true);
  });
});
