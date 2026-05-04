import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { MndExercise } from '../../common/entity/mnd-exercise.entity';

@Injectable()
export class MndExerciseRepository {
  constructor(
    @InjectRepository(MndExercise)
    private readonly repository: Repository<MndExercise>,
  ) {}

  findAllOrdered(masterStackId?: string): Promise<MndExercise[]> {
    const where = this.buildWhere(masterStackId);
    return this.repository.find({
      where,
      relations: { masterStack: true },
      order: { order: 'ASC', complexityLevel: 'ASC' },
    });
  }

  findById(id: string): Promise<MndExercise | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByIdWithRelations(id: string): Promise<MndExercise | null> {
    return this.repository.findOne({
      where: { id },
      relations: { masterStack: true, blocks: { slides: true } },
      order: { blocks: { order: 'ASC', slides: { order: 'ASC' } } },
    });
  }

  findPublishedByMasterStackIds(
    masterStackIds: string[],
  ): Promise<MndExercise[]> {
    if (masterStackIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.repository.find({
      where: {
        masterStackId: In(masterStackIds),
        isPublished: true,
      },
      relations: { masterStack: true },
      order: {
        masterStackId: 'ASC',
        order: 'ASC',
        complexityLevel: 'ASC',
      },
    });
  }

  save(entity: MndExercise): Promise<MndExercise> {
    return this.repository.save(entity);
  }

  async remove(entity: MndExercise): Promise<void> {
    await this.repository.remove(entity);
  }

  create(data: Partial<MndExercise>): MndExercise {
    return this.repository.create(data);
  }

  private buildWhere(
    masterStackId?: string,
  ): FindOptionsWhere<MndExercise> | undefined {
    if (!masterStackId) {
      return undefined;
    }
    return { masterStackId };
  }
}
