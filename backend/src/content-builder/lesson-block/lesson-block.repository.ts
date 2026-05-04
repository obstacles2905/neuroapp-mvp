import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonBlock } from '../../common/entity/lesson-block.entity';
import { LESSON_CONTENT_BLOCK_TYPES_IN_ORDER } from '../../common/enums/lesson-content-block-type.enum';

@Injectable()
export class LessonBlockRepository {
  constructor(
    @InjectRepository(LessonBlock)
    private readonly repository: Repository<LessonBlock>,
  ) {}

  async createDefaultBlocksForLesson(lessonId: string): Promise<void> {
    const count = await this.repository.count({ where: { lessonId } });
    if (count > 0) {
      return;
    }
    const rows = LESSON_CONTENT_BLOCK_TYPES_IN_ORDER.map((blockType, order) =>
      this.repository.create({ lessonId, blockType, order }),
    );
    await this.repository.save(rows);
  }

  findByLessonIdOrdered(lessonId: string): Promise<LessonBlock[]> {
    return this.repository.find({
      where: { lessonId },
      order: { order: 'ASC' },
    });
  }

  findByIdAndLesson(
    blockId: string,
    lessonId: string,
  ): Promise<LessonBlock | null> {
    return this.repository.findOne({ where: { id: blockId, lessonId } });
  }
}
