import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonStep } from '../../common/entity/lesson-step.entity';

@Injectable()
export class LessonStepRepository {
  constructor(
    @InjectRepository(LessonStep)
    private readonly repository: Repository<LessonStep>,
  ) {}

  findByBlockIdOrdered(blockId: string): Promise<LessonStep[]> {
    return this.repository.find({
      where: { lessonBlockId: blockId },
      order: { order: 'ASC' },
    });
  }

  findById(id: string): Promise<LessonStep | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByIdAndBlock(
    stepId: string,
    blockId: string,
  ): Promise<LessonStep | null> {
    return this.repository.findOne({
      where: { id: stepId, lessonBlockId: blockId },
    });
  }

  save(entity: LessonStep): Promise<LessonStep> {
    return this.repository.save(entity);
  }

  async remove(entity: LessonStep): Promise<void> {
    await this.repository.remove(entity);
  }

  create(data: Partial<LessonStep>): LessonStep {
    return this.repository.create(data);
  }

  async updateOrders(
    blockId: string,
    items: { id: string; order: number }[],
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(LessonStep);
      for (const item of items) {
        await repo.update(
          { id: item.id, lessonBlockId: blockId },
          { order: item.order },
        );
      }
    });
  }
}
