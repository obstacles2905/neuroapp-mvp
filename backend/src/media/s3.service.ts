import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3_CLIENT } from '../common/constants/s3-client.token';
import { S3_ENV_KEYS } from '../common/constants/s3-env-keys.constant';
import { buildMediaObjectKey } from '../common/helpers/build-media-object-key.helper';
import { resolveS3PublicUrl } from '../common/helpers/resolve-s3-public-url.helper';
import type { MediaUploadResult } from '../common/interfaces/media-upload-result.interface';

@Injectable()
export class S3Service {
  private readonly bucket: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
  ) {
    this.bucket = this.configService.getOrThrow<string>(S3_ENV_KEYS.BUCKET);
  }

  getFileUrl(objectKey: string): string {
    return resolveS3PublicUrl(this.configService, objectKey);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<MediaUploadResult> {
    const objectKey = buildMediaObjectKey(file.originalname, folder);
    await this.persistObject(objectKey, file.buffer, file.mimetype);
    return { s3Key: objectKey, url: this.getFileUrl(objectKey) };
  }

  async deleteFile(objectKey: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }),
    );
  }

  private async persistObject(
    objectKey: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    const type =
      contentType.length > 0 ? contentType : 'application/octet-stream';
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
