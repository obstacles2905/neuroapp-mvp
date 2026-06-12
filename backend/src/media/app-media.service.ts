import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  APP_ENV_KEYS,
  APP_MEDIA_STREAM_TTL_SECONDS,
} from '../common/constants/app-media-stream.constant';
import { buildAppMediaStreamUrl } from '../common/helpers/build-app-media-stream-url.helper';
import { isAllowedMediaObjectKey } from '../common/helpers/is-allowed-media-object-key.helper';
import { readTrimmedConfigString } from '../common/helpers/read-trimmed-config-string.helper';
import { verifyAppMediaStreamSignature } from '../common/helpers/sign-app-media-stream.helper';

@Injectable()
export class AppMediaService {
  constructor(private readonly configService: ConfigService) {}

  buildStreamUrl(objectKey: string): string {
    const apiBaseUrl = readTrimmedConfigString(
      this.configService,
      APP_ENV_KEYS.PUBLIC_API_URL,
      'http://localhost:3000',
    );
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const exp =
      Math.floor(Date.now() / 1000) + APP_MEDIA_STREAM_TTL_SECONDS;
    return buildAppMediaStreamUrl(apiBaseUrl, objectKey, exp, secret);
  }

  assertStreamAccess(
    objectKey: string,
    expRaw: string,
    signature: string,
  ): void {
    if (!isAllowedMediaObjectKey(objectKey)) {
      throw new BadRequestException('Invalid media key');
    }
    const exp = Number.parseInt(expRaw, 10);
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    if (
      !verifyAppMediaStreamSignature(objectKey, exp, signature, secret)
    ) {
      throw new UnauthorizedException('Invalid or expired media link');
    }
  }
}
