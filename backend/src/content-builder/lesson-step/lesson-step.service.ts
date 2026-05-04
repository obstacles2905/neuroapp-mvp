import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LessonStep } from '../../common/entity/lesson-step.entity';
import { parseLessonStepContent } from '../../common/helpers/parse-lesson-step-content.helper';
import { CreateLessonStepDto } from '../dto/create-lesson-step.dto';
import { ReorderLessonStepsDto } from '../dto/reorder-lesson-steps.dto';
import { ReorderStepItemDto } from '../dto/reorder-step-item.dto';
import { UpdateLessonStepDto } from '../dto/update-lesson-step.dto';
import { LessonBlockRepository } from '../lesson-block/lesson-block.repository';
import { LessonRepository } from '../lesson/lesson.repository';
import { LessonStepRepository } from './lesson-step.repository';

@Injectable()
export class LessonStepService {
  constructor(
    private readonly lessonStepRepository: LessonStepRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly lessonBlockRepository: LessonBlockRepository,
  ) {}

  async findAll(lessonId: string, blockId: string): Promise<LessonStep[]> {
    await this.ensureBlockInLesson(lessonId, blockId);
    return this.lessonStepRepository.findByBlockIdOrdered(blockId);
  }

  async findOne(
    lessonId: string,
    blockId: string,
    stepId: string,
  ): Promise<LessonStep> {
    await this.ensureBlockInLesson(lessonId, blockId);
    const step = await this.lessonStepRepository.findByIdAndBlock(
      stepId,
      blockId,
    );
    if (!step) {
      throw new NotFoundException(`Lesson step ${stepId} not found`);
    }
    return step;
  }

  async create(
    lessonId: string,
    blockId: string,
    dto: CreateLessonStepDto,
  ): Promise<LessonStep> {
    await this.ensureBlockInLesson(lessonId, blockId);
    const parsed = parseLessonStepContent(dto.type, dto.content);
    if (!parsed.success) {
      throw new BadRequestException(parsed.errorMessage);
    }
    const order = dto.order ?? (await this.nextSlideOrder(blockId));
    const entity = this.lessonStepRepository.create({
      lessonBlockId: blockId,
      type: dto.type,
      content: parsed.content,
      order,
    });
    return this.lessonStepRepository.save(entity);
  }

  async update(
    lessonId: string,
    blockId: string,
    stepId: string,
    dto: UpdateLessonStepDto,
  ): Promise<LessonStep> {
    const step = await this.findOne(lessonId, blockId, stepId);
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
    return this.lessonStepRepository.save(step);
  }

  async remove(
    lessonId: string,
    blockId: string,
    stepId: string,
  ): Promise<void> {
    const step = await this.findOne(lessonId, blockId, stepId);
    await this.lessonStepRepository.remove(step);
  }

  async reorder(
    lessonId: string,
    blockId: string,
    dto: ReorderLessonStepsDto,
  ): Promise<void> {
    await this.ensureBlockInLesson(lessonId, blockId);
    const steps =
      await this.lessonStepRepository.findByBlockIdOrdered(blockId);
    this.assertReorderMatchesSteps(steps, dto.items);
    await this.lessonStepRepository.updateOrders(blockId, dto.items);
  }

  private async ensureBlockInLesson(
    lessonId: string,
    blockId: string,
  ): Promise<void> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found`);
    }
    const block = await this.lessonBlockRepository.findByIdAndLesson(
      blockId,
      lessonId,
    );
    if (!block) {
      throw new NotFoundException(`Lesson block ${blockId} not found`);
    }
  }

  private async nextSlideOrder(blockId: string): Promise<number> {
    const steps =
      await this.lessonStepRepository.findByBlockIdOrdered(blockId);
    if (steps.length === 0) {
      return 0;
    }
    return Math.max(...steps.map((s) => s.order)) + 1;
  }

  private assertReorderMatchesSteps(
    steps: LessonStep[],
    items: ReorderStepItemDto[],
  ): void {
    if (steps.length !== items.length) {
      throw new BadRequestException(
        'items length must match number of slides in this block',
      );
    }
    const expected = new Set(steps.map((s) => s.id));
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
