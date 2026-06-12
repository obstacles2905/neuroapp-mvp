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
import { MndExerciseStep } from '../common/entity/mnd-exercise-step.entity';
import { CreateExerciseStepDto } from '../common/dto/exercise-step/create-exercise-step.dto';
import { ReorderExerciseStepsDto } from '../common/dto/exercise-step/reorder-exercise-steps.dto';
import { UpdateExerciseStepDto } from '../common/dto/exercise-step/update-exercise-step.dto';
import { MndExerciseStepService } from './mnd-exercise-step.service';

@ApiTags('mnd-exercise-steps')
@ApiBearerAuth('access-token')
@Controller('admin/mnd/exercises/:exerciseId/blocks/:blockId/steps')
export class MndExerciseStepController {
  constructor(private readonly stepService: MndExerciseStepService) {}

  @Get()
  @ApiOperation({ summary: 'List slides for an MND exercise content block' })
  findAll(
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ): Promise<MndExerciseStep[]> {
    return this.stepService.findAll(exerciseId, blockId);
  }

  @Get(':stepId')
  @ApiOperation({ summary: 'Get single MND exercise slide' })
  findOne(
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<MndExerciseStep> {
    return this.stepService.findOne(exerciseId, blockId, stepId);
  }

  @Post()
  @ApiOperation({ summary: 'Create slide in MND exercise block' })
  @ApiResponse({ status: HttpStatus.CREATED })
  create(
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: CreateExerciseStepDto,
  ): Promise<MndExerciseStep> {
    return this.stepService.create(exerciseId, blockId, dto);
  }

  @Patch('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reorder slides within this MND exercise block' })
  async reorder(
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Body() dto: ReorderExerciseStepsDto,
  ): Promise<void> {
    await this.stepService.reorder(exerciseId, blockId, dto);
  }

  @Patch(':stepId')
  @ApiOperation({ summary: 'Update MND exercise slide' })
  update(
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: UpdateExerciseStepDto,
  ): Promise<MndExerciseStep> {
    return this.stepService.update(exerciseId, blockId, stepId, dto);
  }

  @Delete(':stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete MND exercise slide' })
  async remove(
    @Param('exerciseId', ParseUUIDPipe) exerciseId: string,
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<void> {
    await this.stepService.remove(exerciseId, blockId, stepId);
  }
}
