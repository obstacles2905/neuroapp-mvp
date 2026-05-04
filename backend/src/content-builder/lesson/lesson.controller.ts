import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Lesson } from '../../common/entity/lesson.entity';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { LessonService } from './lesson.service';

@ApiTags('lessons')
@ApiBearerAuth('access-token')
@Controller('admin/lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get()
  @ApiOperation({ summary: 'List lessons' })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(@Query('categoryId') categoryId?: string): Promise<Lesson[]> {
    return this.lessonService.findAll(categoryId);
  }

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Validate lesson content and set status to published',
  })
  @ApiResponse({ status: HttpStatus.OK })
  publish(@Param('id', ParseUUIDPipe) id: string): Promise<Lesson> {
    return this.lessonService.publish(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lesson with steps' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Lesson> {
    return this.lessonService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create lesson' })
  @ApiResponse({ status: HttpStatus.CREATED })
  create(@Body() dto: CreateLessonDto): Promise<Lesson> {
    return this.lessonService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lesson' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
  ): Promise<Lesson> {
    return this.lessonService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lesson' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.lessonService.remove(id);
  }
}
