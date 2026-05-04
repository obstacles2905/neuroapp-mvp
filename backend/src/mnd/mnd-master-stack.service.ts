import { Injectable, NotFoundException } from '@nestjs/common';
import { MndMasterStack } from '../common/entity/mnd-master-stack.entity';
import { CreateMndMasterStackDto } from './dto/create-mnd-master-stack.dto';
import { UpdateMndMasterStackDto } from './dto/update-mnd-master-stack.dto';
import { MndMasterStackRepository } from './repositories/mnd-master-stack.repository';

@Injectable()
export class MndMasterStackService {
  constructor(private readonly stackRepository: MndMasterStackRepository) {}

  findAll(): Promise<MndMasterStack[]> {
    return this.stackRepository.findAllOrdered();
  }

  async findOne(id: string): Promise<MndMasterStack> {
    const stack = await this.stackRepository.findById(id);
    if (!stack) {
      throw new NotFoundException(`MND master stack ${id} not found`);
    }
    return stack;
  }

  create(dto: CreateMndMasterStackDto): Promise<MndMasterStack> {
    const entity = this.stackRepository.create({
      code: dto.code,
      title: dto.title,
      description: dto.description,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.stackRepository.save(entity);
  }

  async update(
    id: string,
    dto: UpdateMndMasterStackDto,
  ): Promise<MndMasterStack> {
    const stack = await this.findOne(id);
    Object.assign(stack, {
      code: dto.code ?? stack.code,
      title: dto.title ?? stack.title,
      description: dto.description ?? stack.description,
      order: dto.order ?? stack.order,
      isActive: dto.isActive ?? stack.isActive,
    });
    return this.stackRepository.save(stack);
  }

  async remove(id: string): Promise<void> {
    const stack = await this.findOne(id);
    await this.stackRepository.remove(stack);
  }
}
