import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MndExerciseStep } from '../common/entity/mnd-exercise-step.entity';
import { parseLessonStepContent } from '../common/helpers/parse-lesson-step-content.helper';
import { CreateLessonStepDto } from '../content-builder/dto/create-lesson-step.dto';
import { ReorderLessonStepsDto } from '../content-builder/dto/reorder-lesson-steps.dto';
import { ReorderStepItemDto } from '../content-builder/dto/reorder-step-item.dto';
import { UpdateLessonStepDto } from '../content-builder/dto/update-lesson-step.dto';
import { MndExerciseBlockRepository } from './repositories/mnd-exercise-block.repository';
import { MndExerciseStepRepository } from './repositories/mnd-exercise-step.repository';
import { MndExerciseRepository } from './repositories/mnd-exercise.repository';

@Injectable()
export class MndExerciseStepService {
  constructor(
    private readonly stepRepository: MndExerciseStepRepository,
    private readonly exerciseRepository: MndExerciseRepository,
    private readonly blockRepository: MndExerciseBlockRepository,
  ) {}

  async findAll(
    exerciseId: string,
    blockId: string,
  ): Promise<MndExerciseStep[]> {
    await this.ensureBlockInExercise(exerciseId, blockId);
    return this.stepRepository.findByBlockIdOrdered(blockId);
  }

  async findOne(
    exerciseId: string,
    blockId: string,
    stepId: string,
  ): Promise<MndExerciseStep> {
    await this.ensureBlockInExercise(exerciseId, blockId);
    const step = await this.stepRepository.findByIdAndBlock(stepId, blockId);
    if (!step) {
      throw new NotFoundException(`MND exercise step ${stepId} not found`);
    }
    return step;
  }

  async create(
    exerciseId: string,
    blockId: string,
    dto: CreateLessonStepDto,
  ): Promise<MndExerciseStep> {
    await this.ensureBlockInExercise(exerciseId, blockId);
    const parsed = parseLessonStepContent(dto.type, dto.content);
    if (!parsed.success) {
      throw new BadRequestException(parsed.errorMessage);
    }
    const order = dto.order ?? (await this.nextSlideOrder(blockId));
    const entity = this.stepRepository.create({
      exerciseBlockId: blockId,
      type: dto.type,
      content: parsed.content,
      order,
    });
    return this.stepRepository.save(entity);
  }

  async update(
    exerciseId: string,
    blockId: string,
    stepId: string,
    dto: UpdateLessonStepDto,
  ): Promise<MndExerciseStep> {
    const step = await this.findOne(exerciseId, blockId, stepId);
    const nextType = dto.type ?? step.type;
    const rawContent =
      dto.content ?? (step.content as unknown as Record<string, unknown>);
    const parsed = parseLessonStepContent(nextType, rawContent);
    if (!parsed.success) {
      throw new BadRequestException(parsed.errorMessage);
    }
    step.type = nextType;
    step.content = parsed.content;
    if (dto.order !== undefined) {
      step.order = dto.order;
    }
    return this.stepRepository.save(step);
  }

  async remove(
    exerciseId: string,
    blockId: string,
    stepId: string,
  ): Promise<void> {
    const step = await this.findOne(exerciseId, blockId, stepId);
    await this.stepRepository.remove(step);
  }

  async reorder(
    exerciseId: string,
    blockId: string,
    dto: ReorderLessonStepsDto,
  ): Promise<void> {
    await this.ensureBlockInExercise(exerciseId, blockId);
    const steps = await this.stepRepository.findByBlockIdOrdered(blockId);
    this.assertReorderMatchesSteps(steps, dto.items);
    await this.stepRepository.updateOrders(blockId, dto.items);
  }

  private async ensureBlockInExercise(
    exerciseId: string,
    blockId: string,
  ): Promise<void> {
    const exercise = await this.exerciseRepository.findById(exerciseId);
    if (!exercise) {
      throw new NotFoundException(`MND exercise ${exerciseId} not found`);
    }
    const block = await this.blockRepository.findByIdAndExercise(
      blockId,
      exerciseId,
    );
    if (!block) {
      throw new NotFoundException(`MND exercise block ${blockId} not found`);
    }
  }

  private async nextSlideOrder(blockId: string): Promise<number> {
    const steps = await this.stepRepository.findByBlockIdOrdered(blockId);
    if (steps.length === 0) {
      return 0;
    }
    return Math.max(...steps.map((step) => step.order)) + 1;
  }

  private assertReorderMatchesSteps(
    steps: MndExerciseStep[],
    items: ReorderStepItemDto[],
  ): void {
    if (steps.length !== items.length) {
      throw new BadRequestException(
        'items length must match number of slides in this block',
      );
    }
    const expected = new Set(steps.map((step) => step.id));
    const seen = new Set<string>();
    for (const item of items) {
      if (!expected.has(item.id)) {
        throw new BadRequestException(`Unknown slide id ${item.id}`);
      }
      if (seen.has(item.id)) {
        throw new BadRequestException('duplicate slide id in reorder payload');
      }
      seen.add(item.id);
    }
  }
}
