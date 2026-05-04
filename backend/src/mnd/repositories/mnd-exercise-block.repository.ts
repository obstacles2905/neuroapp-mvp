import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MndExerciseBlock } from '../../common/entity/mnd-exercise-block.entity';
import { LESSON_CONTENT_BLOCK_TYPES_IN_ORDER } from '../../common/enums/lesson-content-block-type.enum';

@Injectable()
export class MndExerciseBlockRepository {
  constructor(
    @InjectRepository(MndExerciseBlock)
    private readonly repository: Repository<MndExerciseBlock>,
  ) {}

  async createDefaultBlocksForExercise(exerciseId: string): Promise<void> {
    const count = await this.repository.count({ where: { exerciseId } });
    if (count > 0) {
      return;
    }
    const rows = LESSON_CONTENT_BLOCK_TYPES_IN_ORDER.map((blockType, order) =>
      this.repository.create({ exerciseId, blockType, order }),
    );
    await this.repository.save(rows);
  }

  findByIdAndExercise(
    blockId: string,
    exerciseId: string,
  ): Promise<MndExerciseBlock | null> {
    return this.repository.findOne({ where: { id: blockId, exerciseId } });
  }
}
