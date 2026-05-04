import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MndExerciseStep } from '../../common/entity/mnd-exercise-step.entity';

@Injectable()
export class MndExerciseStepRepository {
  constructor(
    @InjectRepository(MndExerciseStep)
    private readonly repository: Repository<MndExerciseStep>,
  ) {}

  findByBlockIdOrdered(blockId: string): Promise<MndExerciseStep[]> {
    return this.repository.find({
      where: { exerciseBlockId: blockId },
      order: { order: 'ASC' },
    });
  }

  findByIdAndBlock(
    stepId: string,
    blockId: string,
  ): Promise<MndExerciseStep | null> {
    return this.repository.findOne({
      where: { id: stepId, exerciseBlockId: blockId },
    });
  }

  save(entity: MndExerciseStep): Promise<MndExerciseStep> {
    return this.repository.save(entity);
  }

  async remove(entity: MndExerciseStep): Promise<void> {
    await this.repository.remove(entity);
  }

  create(data: Partial<MndExerciseStep>): MndExerciseStep {
    return this.repository.create(data);
  }

  async updateOrders(
    blockId: string,
    items: { id: string; order: number }[],
  ): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(MndExerciseStep);
      for (const item of items) {
        await repo.update(
          { id: item.id, exerciseBlockId: blockId },
          { order: item.order },
        );
      }
    });
  }
}
