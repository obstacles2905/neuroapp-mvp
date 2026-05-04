import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3_CLIENT } from '../common/constants/s3-client.token';
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
  ],
  exports: [S3Service],
})
export class MediaModule {}
