import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  PRESIGN_S3_CLIENT,
  S3_CLIENT,
} from '../common/constants/s3-client.token';
import { createPresignS3ClientFromConfig } from '../common/helpers/create-presign-s3-client.helper';
import { createS3ClientFromConfig } from '../common/helpers/create-s3-client.helper';
import { MediaController } from './media.controller';
import { S3Service } from './s3.service';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [
    S3Service,
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createS3ClientFromConfig(configService),
    },
    {
      provide: PRESIGN_S3_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createPresignS3ClientFromConfig(configService),
    },
  ],
  exports: [S3Service],
})
export class MediaModule {}
