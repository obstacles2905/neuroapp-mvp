import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ArchitectWordVideo } from '../common/entity/architect-word-video.entity';

@Injectable()
export class ArchitectWordRepository {
  constructor(
    @InjectRepository(ArchitectWordVideo)
    private readonly repository: Repository<ArchitectWordVideo>,
  ) {}

  findBySymptomId(symptomId: string): Promise<ArchitectWordVideo[]> {
    return this.repository.find({
      where: { symptomId },
      order: { slot: 'ASC' },
    });
  }

  findBySymptomIds(symptomIds: string[]): Promise<ArchitectWordVideo[]> {
    if (symptomIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.repository.find({
      where: { symptomId: In(symptomIds) },
      order: { symptomId: 'ASC', slot: 'ASC' },
    });
  }

  findBySymptomIdAndSlot(
    symptomId: string,
    slot: number,
  ): Promise<ArchitectWordVideo | null> {
    return this.repository.findOne({ where: { symptomId, slot } });
  }

  create(data: Partial<ArchitectWordVideo>): ArchitectWordVideo {
    return this.repository.create(data);
  }

  save(entity: ArchitectWordVideo): Promise<ArchitectWordVideo> {
    return this.repository.save(entity);
  }

  async remove(entity: ArchitectWordVideo): Promise<void> {
    await this.repository.remove(entity);
  }
}
