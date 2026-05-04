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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LessonStep } from '../../common/entity/lesson-step.entity';
import { CreateLessonStepDto } from '../dto/create-lesson-step.dto';
import { ReorderLessonStepsDto } from '../dto/reorder-lesson-steps.dto';
import { UpdateLessonStepDto } from '../dto/update-lesson-step.dto';
import { LessonStepService } from './lesson-step.service';

@ApiTags('lesson-steps')
@ApiBearerAuth('access-token')
@Controller('admin/lessons/:lessonId/blocks/:blockId/steps')
export class LessonStepController {
  constructor(private readonly lessonStepService: LessonStepService) {}

  @Get()
  @ApiOperation({ summary: 'List slides for a lesson content block' })
  findAll(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ): Promise<LessonStep[]> {
    return this.lessonStepService.findAll(lessonId, blockId);
  }

  @Get(':stepId')
  @ApiOperation({ summary: 'Get single slide' })
  findOne(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<LessonStep> {
    return this.lessonStepService.findOne(lessonId, blockId, stepId);
  }

  @Post()
  @ApiOperation({ summary: 'Create slide in block' })
  @ApiResponse({ status: HttpStatus.CREATED })
  create(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: CreateLessonStepDto,
  ): Promise<LessonStep> {
    return this.lessonStepService.create(lessonId, blockId, dto);
  }

  @Patch('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reorder slides within this block' })
  async reorder(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: ReorderLessonStepsDto,
  ): Promise<void> {
    await this.lessonStepService.reorder(lessonId, blockId, dto);
  }

  @Patch(':stepId')
  @ApiOperation({ summary: 'Update slide' })
  update(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: UpdateLessonStepDto,
  ): Promise<LessonStep> {
    return this.lessonStepService.update(lessonId, blockId, stepId, dto);
  }

  @Delete(':stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete slide' })
  async remove(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<void> {
    await this.lessonStepService.remove(lessonId, blockId, stepId);
  }
}
