import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DEFAULT_MEDIA_MAX_FILE_BYTES } from '../common/constants/default-media-upload.constant';
import { UploadMediaResponseDto } from './dto/upload-media-response.dto';
import { S3Service } from './s3.service';

@ApiTags('media')
@ApiBearerAuth('access-token')
@Controller('admin/media')
export class MediaController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: DEFAULT_MEDIA_MAX_FILE_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file to object storage (MinIO / S3)' })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Optional key prefix (e.g. videos)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: UploadMediaResponseDto })
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('folder') folder?: string,
  ): Promise<UploadMediaResponseDto> {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return this.s3Service.uploadFile(file, folder);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an object from storage by key' })
  @ApiQuery({ name: 'key', required: true })
  async remove(@Query('key') key: string | undefined): Promise<void> {
    if (!key || key.trim().length === 0) {
      throw new BadRequestException('key is required');
    }
    await this.s3Service.deleteFile(key);
  }
}
