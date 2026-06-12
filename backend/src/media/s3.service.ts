import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_MEDIA_MAX_FILE_BYTES } from '../common/constants/default-media-upload.constant';
import { MEDIA_PRESIGN_EXPIRES_SECONDS } from '../common/constants/media-presign.constant';
import { MEDIA_ENV_KEYS } from '../common/constants/media-env-keys.constant';
import {
  PRESIGN_S3_CLIENT,
  S3_CLIENT,
} from '../common/constants/s3-client.token';
import { S3_ENV_KEYS } from '../common/constants/s3-env-keys.constant';
import { buildMediaObjectKey } from '../common/helpers/build-media-object-key.helper';
import { resolveS3PublicUrl } from '../common/helpers/resolve-s3-public-url.helper';
import type { MediaPresignResult } from '../common/interfaces/media-presign-result.interface';
import type { MediaUploadResult } from '../common/interfaces/media-upload-result.interface';
import type { Readable } from 'stream';

type PresignUploadInput = {
  originalName: string;
  contentType: string;
  fileSize: number;
  folder?: string;
};

type S3ObjectStreamResult = {
  body: Readable;
  contentType: string;
  contentLength: number | undefined;
  contentRange: string | undefined;
  statusCode: 200 | 206;
};

@Injectable()
export class S3Service {
  private readonly bucket: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    @Inject(PRESIGN_S3_CLIENT) private readonly presignS3Client: S3Client,
  ) {
    this.bucket = this.configService.getOrThrow<string>(S3_ENV_KEYS.BUCKET);
  }

  getFileUrl(objectKey: string): string {
    return resolveS3PublicUrl(this.configService, objectKey);
  }

  async getObjectStream(
    objectKey: string,
    rangeHeader?: string,
  ): Promise<S3ObjectStreamResult> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Range: rangeHeader,
      }),
    );
    if (response.Body == null) {
      throw new Error('S3 object body is empty');
    }
    const statusCode = rangeHeader != null && rangeHeader.length > 0 ? 206 : 200;
    return {
      body: response.Body as Readable,
      contentType: response.ContentType ?? 'application/octet-stream',
      contentLength: response.ContentLength,
      contentRange: response.ContentRange,
      statusCode,
    };
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<MediaUploadResult> {
    const objectKey = buildMediaObjectKey(file.originalname, folder);
    await this.persistObject(objectKey, file.buffer, file.mimetype);
    return { s3Key: objectKey, url: this.getFileUrl(objectKey) };
  }

  async createPresignedUpload(
    input: PresignUploadInput,
  ): Promise<MediaPresignResult> {
    const maxBytes = this.resolveMaxFileBytes();
    if (input.fileSize > maxBytes) {
      throw new BadRequestException(
        `file exceeds maximum size of ${maxBytes} bytes`,
      );
    }

    const objectKey = buildMediaObjectKey(input.originalName, input.folder);
    const contentType = this.resolveContentType(input.contentType);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      ContentType: contentType,
      ContentLength: input.fileSize,
    });
    const uploadUrl = await getSignedUrl(this.presignS3Client, command, {
      expiresIn: MEDIA_PRESIGN_EXPIRES_SECONDS,
    });

    return {
      uploadUrl,
      s3Key: objectKey,
      url: this.getFileUrl(objectKey),
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    };
  }

  async deleteFile(objectKey: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
  }

  private resolveMaxFileBytes(): number {
    const raw = this.configService.get<string>(MEDIA_ENV_KEYS.MAX_FILE_BYTES);
    if (raw === undefined || raw.length === 0) {
      return DEFAULT_MEDIA_MAX_FILE_BYTES;
    }
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return DEFAULT_MEDIA_MAX_FILE_BYTES;
    }
    return parsed;
  }

  private resolveContentType(contentType: string): string {
    if (contentType.length > 0) {
      return contentType;
    }
    return 'application/octet-stream';
  }

  private async persistObject(
    objectKey: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    const type = this.resolveContentType(contentType);
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ContentType: type,
      }),
    );
  }
}
