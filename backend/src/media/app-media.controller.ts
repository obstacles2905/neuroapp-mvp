import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { AppMediaService } from './app-media.service';
import { S3Service } from './s3.service';

@ApiTags('app-media')
@Controller('app/media')
export class AppMediaController {
  constructor(
    private readonly appMediaService: AppMediaService,
    private readonly s3Service: S3Service,
  ) {}

  @Public()
  @Get('stream')
  @ApiOperation({
    summary:
      'Stream lesson/MND media from object storage via signed URL (for web video player)',
  })
  async stream(
    @Query('key') objectKey: string,
    @Query('exp') expRaw: string,
    @Query('sig') signature: string,
    @Headers('range') rangeHeader: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    this.appMediaService.assertStreamAccess(objectKey, expRaw, signature);
    try {
      const objectStream = await this.s3Service.getObjectStream(
        objectKey,
        rangeHeader,
      );
      res.status(objectStream.statusCode);
      res.setHeader('Content-Type', objectStream.contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      if (objectStream.contentLength != null) {
        res.setHeader('Content-Length', String(objectStream.contentLength));
      }
      if (objectStream.contentRange != null) {
        res.setHeader('Content-Range', objectStream.contentRange);
      }
      objectStream.body.pipe(res);
    } catch {
      throw new NotFoundException();
    }
  }
}
