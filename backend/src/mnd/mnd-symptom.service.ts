import { Injectable, NotFoundException } from '@nestjs/common';
import { MndSymptom } from '../common/entity/mnd-symptom.entity';
import { CreateMndSymptomDto } from './dto/create-mnd-symptom.dto';
import { UpdateMndSymptomDto } from './dto/update-mnd-symptom.dto';
import { MndSymptomRepository } from './repositories/mnd-symptom.repository';

@Injectable()
export class MndSymptomService {
  constructor(private readonly symptomRepository: MndSymptomRepository) {}

  findAll(): Promise<MndSymptom[]> {
    return this.symptomRepository.findAllOrdered();
  }

  findPublishedForOnboarding(): Promise<MndSymptom[]> {
    return this.symptomRepository.findPublishedOrdered();
  }

  async findOne(id: string): Promise<MndSymptom> {
    const symptom = await this.symptomRepository.findById(id);
    if (!symptom) {
      throw new NotFoundException(`MND symptom ${id} not found`);
    }
    return symptom;
  }

  create(dto: CreateMndSymptomDto): Promise<MndSymptom> {
    const entity = this.symptomRepository.create({
      code: dto.code,
      title: dto.title,
      description: dto.description,
      neurophysiologicalRoot: dto.neurophysiologicalRoot,
      order: dto.order ?? 0,
      isPublished: dto.isPublished ?? false,
    });
    return this.symptomRepository.save(entity);
  }

  async update(id: string, dto: UpdateMndSymptomDto): Promise<MndSymptom> {
    const symptom = await this.findOne(id);
    this.applyUpdate(symptom, dto);
    return this.symptomRepository.save(symptom);
  }

  async remove(id: string): Promise<void> {
    const symptom = await this.findOne(id);
    await this.symptomRepository.remove(symptom);
  }

  private applyUpdate(symptom: MndSymptom, dto: UpdateMndSymptomDto): void {
    Object.assign(symptom, {
      code: dto.code ?? symptom.code,
      title: dto.title ?? symptom.title,
      description: dto.description ?? symptom.description,
      neurophysiologicalRoot:
        dto.neurophysiologicalRoot ?? symptom.neurophysiologicalRoot,
      order: dto.order ?? symptom.order,
      isPublished: dto.isPublished ?? symptom.isPublished,
    });
  }
}
