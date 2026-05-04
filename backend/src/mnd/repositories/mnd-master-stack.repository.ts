import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MndMasterStack } from '../../common/entity/mnd-master-stack.entity';

@Injectable()
export class MndMasterStackRepository {
  constructor(
    @InjectRepository(MndMasterStack)
    private readonly repository: Repository<MndMasterStack>,
  ) {}

  findAllOrdered(): Promise<MndMasterStack[]> {
    return this.repository.find({ order: { order: 'ASC' } });
  }

  findById(id: string): Promise<MndMasterStack | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByIds(ids: string[]): Promise<MndMasterStack[]> {
    return this.repository.findBy({ id: In(ids) });
  }

  save(entity: MndMasterStack): Promise<MndMasterStack> {
    return this.repository.save(entity);
  }

  async remove(entity: MndMasterStack): Promise<void> {
    await this.repository.remove(entity);
  }

  create(data: Partial<MndMasterStack>): MndMasterStack {
    return this.repository.create(data);
  }
}
