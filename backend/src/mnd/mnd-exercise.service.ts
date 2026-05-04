import { Injectable, NotFoundException } from '@nestjs/common';
import { MndExercise } from '../common/entity/mnd-exercise.entity';
import { CreateMndExerciseDto } from './dto/create-mnd-exercise.dto';
import { UpdateMndExerciseDto } from './dto/update-mnd-exercise.dto';
import { MndExerciseBlockRepository } from './repositories/mnd-exercise-block.repository';
import { MndExerciseRepository } from './repositories/mnd-exercise.repository';
import { MndMasterStackRepository } from './repositories/mnd-master-stack.repository';

@Injectable()
export class MndExerciseService {
  constructor(
    private readonly exerciseRepository: MndExerciseRepository,
    private readonly blockRepository: MndExerciseBlockRepository,
    private readonly stackRepository: MndMasterStackRepository,
  ) {}

  findAll(masterStackId?: string): Promise<MndExercise[]> {
    return this.exerciseRepository.findAllOrdered(masterStackId);
  }

  async findOne(id: string): Promise<MndExercise> {
    let exercise = await this.exerciseRepository.findByIdWithRelations(id);
    if (!exercise) {
      throw new NotFoundException(`MND exercise ${id} not found`);
    }
    if (!exercise.blocks || exercise.blocks.length === 0) {
      await this.blockRepository.createDefaultBlocksForExercise(id);
      exercise = (await this.exerciseRepository.findByIdWithRelations(id))!;
    }
    this.sortExerciseContent(exercise);
    return exercise;
  }

  /** Опубликованное упражнение для мобильного приложения. */
  async findOnePublishedForApp(id: string): Promise<MndExercise> {
    const exercise = await this.findOne(id);
    if (!exercise.isPublished) {
      throw new NotFoundException(`MND exercise ${id} not found`);
    }
    return exercise;
  }

  async create(dto: CreateMndExerciseDto): Promise<MndExercise> {
    await this.ensureStackExists(dto.masterStackId);
    const entity = this.exerciseRepository.create({
      ...dto,
      content: dto.content ?? null,
      order: dto.order ?? 0,
      isPublished: dto.isPublished ?? false,
    });
    const saved = await this.exerciseRepository.save(entity);
    await this.blockRepository.createDefaultBlocksForExercise(saved.id);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateMndExerciseDto): Promise<MndExercise> {
    const exercise = await this.findOne(id);
    await this.ensureNextStackExists(dto.masterStackId);
    Object.assign(exercise, this.buildUpdate(exercise, dto));
    return this.exerciseRepository.save(exercise);
  }

  async remove(id: string): Promise<void> {
    const exercise = await this.findOne(id);
    await this.exerciseRepository.remove(exercise);
  }

  private async ensureStackExists(masterStackId: string): Promise<void> {
    const stack = await this.stackRepository.findById(masterStackId);
    if (!stack) {
      throw new NotFoundException(
        `MND master stack ${masterStackId} not found`,
      );
    }
  }

  private async ensureNextStackExists(masterStackId?: string): Promise<void> {
    if (!masterStackId) {
      return;
    }
    await this.ensureStackExists(masterStackId);
  }

  private buildUpdate(
    exercise: MndExercise,
    dto: UpdateMndExerciseDto,
  ): Partial<MndExercise> {
    return {
      masterStackId: dto.masterStackId ?? exercise.masterStackId,
      direction: dto.direction ?? exercise.direction,
      complexityLevel: dto.complexityLevel ?? exercise.complexityLevel,
      title: dto.title ?? exercise.title,
      content: dto.content === undefined ? exercise.content : dto.content,
      order: dto.order ?? exercise.order,
      isPublished: dto.isPublished ?? exercise.isPublished,
    };
  }

  private sortExerciseContent(exercise: MndExercise): void {
    if (!exercise.blocks?.length) {
      return;
    }
    exercise.blocks = [...exercise.blocks].sort((a, b) => a.order - b.order);
    for (const block of exercise.blocks) {
      if (block.slides?.length) {
        block.slides = [...block.slides].sort((a, b) => a.order - b.order);
      }
    }
  }
}
