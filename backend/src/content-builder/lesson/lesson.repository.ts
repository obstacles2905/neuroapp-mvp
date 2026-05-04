import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Lesson } from '../../common/entity/lesson.entity';
import { LessonStatus } from '../../common/enums/lesson-status.enum';

@Injectable()
export class LessonRepository {
  constructor(
    @InjectRepository(Lesson)
    private readonly repository: Repository<Lesson>,
  ) {}

  findAllOrdered(categoryId?: string): Promise<Lesson[]> {
    const where = categoryId ? { categoryId } : undefined;
    return this.repository.find({
      where,
      order: { order: 'ASC' },
    });
  }

  findPublishedByCategoryId(categoryId: string): Promise<Lesson[]> {
    return this.repository.find({
      where: { categoryId, status: LessonStatus.PUBLISHED },
      order: { order: 'ASC' },
    });
  }

  findPublishedByCategoryIds(categoryIds: string[]): Promise<Lesson[]> {
    if (categoryIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.repository.find({
      where: { categoryId: In(categoryIds), status: LessonStatus.PUBLISHED },
      order: { order: 'ASC' },
    });
  }

  findById(id: string): Promise<Lesson | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByIdWithRelations(id: string): Promise<Lesson | null> {
    return this.repository.findOne({
      where: { id },
      relations: { blocks: { slides: true }, category: true },
    });
  }

  save(entity: Lesson): Promise<Lesson> {
    return this.repository.save(entity);
  }

  async remove(entity: Lesson): Promise<void> {
    await this.repository.remove(entity);
  }

  create(data: Partial<Lesson>): Lesson {
    return this.repository.create(data);
  }
}
