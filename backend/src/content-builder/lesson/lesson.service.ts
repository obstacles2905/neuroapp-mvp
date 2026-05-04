import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Lesson } from '../../common/entity/lesson.entity';
import { LessonStatus } from '../../common/enums/lesson-status.enum';
import { getFirstLessonPublishBlocker } from '../../common/helpers/lesson-publish-validation.helper';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { CategoryRepository } from '../category/category.repository';
import { LessonBlockRepository } from '../lesson-block/lesson-block.repository';
import { LessonRepository } from './lesson.repository';

@Injectable()
export class LessonService {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly lessonBlockRepository: LessonBlockRepository,
  ) {}

  findAll(categoryId?: string): Promise<Lesson[]> {
    return this.lessonRepository.findAllOrdered(categoryId);
  }

  async findOne(id: string): Promise<Lesson> {
    let lesson = await this.lessonRepository.findByIdWithRelations(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson ${id} not found`);
    }
    if (!lesson.blocks || lesson.blocks.length === 0) {
      await this.lessonBlockRepository.createDefaultBlocksForLesson(id);
      lesson = (await this.lessonRepository.findByIdWithRelations(id))!;
    }
    this.sortLessonContentTree(lesson);
    return lesson;
  }

  async create(dto: CreateLessonDto): Promise<Lesson> {
    await this.ensureCategoryExists(dto.categoryId);
    const entity = this.lessonRepository.create({
      categoryId: dto.categoryId,
      title: dto.title,
      status: dto.status ?? LessonStatus.DRAFT,
      order: dto.order ?? 0,
    });
    const saved = await this.lessonRepository.save(entity);
    await this.lessonBlockRepository.createDefaultBlocksForLesson(saved.id);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson ${id} not found`);
    }
    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
      lesson.categoryId = dto.categoryId;
    }
    if (dto.title !== undefined) {
      lesson.title = dto.title;
    }
    if (dto.status !== undefined) {
      lesson.status = dto.status;
    }
    if (dto.order !== undefined) {
      lesson.order = dto.order;
    }
    await this.lessonRepository.save(lesson);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson ${id} not found`);
    }
    if (lesson.status === LessonStatus.PUBLISHED) {
      throw new BadRequestException(
        'Нельзя удалить опубликованный урок. Переведите его в черновик или снимите с публикации.',
      );
    }
    await this.lessonRepository.remove(lesson);
  }

  async publish(id: string): Promise<Lesson> {
    let lesson = await this.lessonRepository.findByIdWithRelations(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson ${id} not found`);
    }
    if (!lesson.blocks || lesson.blocks.length === 0) {
      await this.lessonBlockRepository.createDefaultBlocksForLesson(id);
      lesson = (await this.lessonRepository.findByIdWithRelations(id))!;
    }
    this.sortLessonContentTree(lesson);
    const blocker = getFirstLessonPublishBlocker(lesson.blocks);
    if (blocker) {
      throw new BadRequestException(blocker);
    }
    lesson.status = LessonStatus.PUBLISHED;
    await this.lessonRepository.save(lesson);
    return this.findOne(id);
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
  }

  private sortLessonContentTree(lesson: Lesson): void {
    if (!lesson.blocks?.length) {
      return;
    }
    lesson.blocks = [...lesson.blocks].sort((a, b) => a.order - b.order);
    for (const block of lesson.blocks) {
      if (block.slides?.length) {
        block.slides = [...block.slides].sort((a, b) => a.order - b.order);
      }
    }
  }
}
