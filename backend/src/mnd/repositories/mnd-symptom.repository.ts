import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MndSymptom } from '../../common/entity/mnd-symptom.entity';

@Injectable()
export class MndSymptomRepository {
  constructor(
    @InjectRepository(MndSymptom)
    private readonly repository: Repository<MndSymptom>,
  ) {}

  findAllOrdered(): Promise<MndSymptom[]> {
    return this.repository.find({ order: { order: 'ASC' } });
  }

  findPublishedOrdered(): Promise<MndSymptom[]> {
    return this.repository.find({
      where: { isPublished: true },
      order: { order: 'ASC' },
    });
  }

  findById(id: string): Promise<MndSymptom | null> {
    return this.repository.findOne({ where: { id } });
  }

  save(entity: MndSymptom): Promise<MndSymptom> {
    return this.repository.save(entity);
  }

  async remove(entity: MndSymptom): Promise<void> {
    await this.repository.remove(entity);
  }

  create(data: Partial<MndSymptom>): MndSymptom {
    return this.repository.create(data);
  }
}
