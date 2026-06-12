import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
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
import {
  buildStableMediaObjectKey,
  legacyMediaObjectKeySuffix,
} from '../common/helpers/build-stable-media-object-key.helper';
import { isS3NotFoundError } from '../common/helpers/is-s3-not-found-error.helper';
import { resolveS3PublicUrl } from '../common/helpers/resolve-s3-public-url.helper';
import { sanitizeUploadFileName } from '../common/helpers/sanitize-upload-file-name.helper';
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

type ResolvedUploadObjectKey = {
  objectKey: string;
  reused: boolean;
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
    const resolved = await this.resolveUploadObjectKey(file.originalname, folder);
    if (!resolved.reused) {
      await this.persistObject(
        resolved.objectKey,
        file.buffer,
        file.mimetype,
      );
    }
    return {
      s3Key: resolved.objectKey,
      url: this.getFileUrl(resolved.objectKey),
      deduplicated: resolved.reused,
    };
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

    const resolved = await this.resolveUploadObjectKey(
      input.originalName,
      input.folder,
    );
    const url = this.getFileUrl(resolved.objectKey);
    if (resolved.reused) {
      return {
        uploadUrl: '',
        s3Key: resolved.objectKey,
        url,
        method: 'PUT',
        headers: {},
        deduplicated: true,
      };
    }

    const contentType = this.resolveContentType(input.contentType);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: resolved.objectKey,
      ContentType: contentType,
      ContentLength: input.fileSize,
    });
    const uploadUrl = await getSignedUrl(this.presignS3Client, command, {
      expiresIn: MEDIA_PRESIGN_EXPIRES_SECONDS,
    });

    return {
      uploadUrl,
      s3Key: resolved.objectKey,
      url,
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      deduplicated: false,
    };
  }

  async deleteFile(objectKey: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
  }

  private async resolveUploadObjectKey(
    originalName: string,
    folder?: string,
  ): Promise<ResolvedUploadObjectKey> {
    const safeName = sanitizeUploadFileName(originalName);
    const stableKey = buildStableMediaObjectKey(originalName, folder);

    if (await this.objectExists(stableKey)) {
      return { objectKey: stableKey, reused: true };
    }

    const legacyKey = await this.findLegacyObjectKeyByFileName(folder, safeName);
    if (legacyKey != null) {
      return { objectKey: legacyKey, reused: true };
    }

    return { objectKey: stableKey, reused: false };
  }

  private async objectExists(objectKey: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );
      return true;
    } catch (error) {
      if (isS3NotFoundError(error)) {
        return false;
      }
      throw error;
    }
  }

  private async findLegacyObjectKeyByFileName(
    folder: string | undefined,
    safeName: string,
  ): Promise<string | null> {
    const prefix = this.resolveListPrefix(folder);
    if (prefix == null) {
      return null;
    }

    const suffix = legacyMediaObjectKeySuffix(safeName);
    let continuationToken: string | undefined;

    do {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        }),
      );

      for (const item of response.Contents ?? []) {
        const key = item.Key;
        if (key == null) {
          continue;
        }
        if (key.endsWith(suffix)) {
          return key;
        }
      }

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken != null);

    return null;
  }

  private resolveListPrefix(folder: string | undefined): string | null {
    if (folder == null || folder.trim().length === 0) {
      return null;
    }
    const normalized = folder.replace(/^\/+|\/+$/g, '').replace(/\\/g, '/');
    return `${normalized}/`;
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
