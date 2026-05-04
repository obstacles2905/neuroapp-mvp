import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MndMatrixRule } from '../common/entity/mnd-matrix-rule.entity';
import { MndMatrixRuleStack } from '../common/entity/mnd-matrix-rule-stack.entity';
import { CreateMndMatrixRuleDto } from './dto/create-mnd-matrix-rule.dto';
import { MndMatrixRuleStackDto } from './dto/mnd-matrix-rule-stack.dto';
import { UpdateMndMatrixRuleDto } from './dto/update-mnd-matrix-rule.dto';
import { MndMasterStackRepository } from './repositories/mnd-master-stack.repository';
import { MndMatrixRuleRepository } from './repositories/mnd-matrix-rule.repository';
import { MndSymptomRepository } from './repositories/mnd-symptom.repository';

@Injectable()
export class MndMatrixRuleService {
  constructor(
    private readonly ruleRepository: MndMatrixRuleRepository,
    private readonly symptomRepository: MndSymptomRepository,
    private readonly stackRepository: MndMasterStackRepository,
  ) {}

  findAll(): Promise<MndMatrixRule[]> {
    return this.ruleRepository.findAllWithRelations();
  }

  async findOne(id: string): Promise<MndMatrixRule> {
    const rule = await this.ruleRepository.findByIdWithRelations(id);
    if (!rule) {
      throw new NotFoundException(`MND matrix rule ${id} not found`);
    }
    return rule;
  }

  async create(dto: CreateMndMatrixRuleDto): Promise<MndMatrixRule> {
    this.assertPercentBalance(dto.bottomUpPercent, dto.topDownPercent);
    await this.ensureSymptomExists(dto.symptomId);
    await this.ensureStacksExist(dto.stacks);
    const rule = this.ruleRepository.create({
      symptomId: dto.symptomId,
      targetAction: dto.targetAction,
      bottomUpPercent: dto.bottomUpPercent,
      topDownPercent: dto.topDownPercent,
    });
    return this.ruleRepository.saveWithStacks(rule, this.buildStacks(dto.stacks));
  }

  async update(
    id: string,
    dto: UpdateMndMatrixRuleDto,
  ): Promise<MndMatrixRule> {
    const rule = await this.findOne(id);
    await this.ensureNextSymptomExists(dto.symptomId);
    await this.ensureNextStacksExist(dto.stacks);
    this.applyUpdate(rule, dto);
    return this.ruleRepository.saveWithStacks(rule, this.nextStacks(rule, dto));
  }

  async remove(id: string): Promise<void> {
    const rule = await this.findOne(id);
    await this.ruleRepository.remove(rule);
  }

  private applyUpdate(
    rule: MndMatrixRule,
    dto: UpdateMndMatrixRuleDto,
  ): void {
    const bottomUpPercent = dto.bottomUpPercent ?? rule.bottomUpPercent;
    const topDownPercent = dto.topDownPercent ?? rule.topDownPercent;
    this.assertPercentBalance(bottomUpPercent, topDownPercent);
    Object.assign(rule, {
      symptomId: dto.symptomId ?? rule.symptomId,
      targetAction: dto.targetAction ?? rule.targetAction,
      bottomUpPercent,
      topDownPercent,
    });
  }

  private assertPercentBalance(bottomUp: number, topDown: number): void {
    if (bottomUp + topDown === 100) {
      return;
    }
    throw new BadRequestException('MND weights must add up to 100');
  }

  private async ensureSymptomExists(symptomId: string): Promise<void> {
    const symptom = await this.symptomRepository.findById(symptomId);
    if (!symptom) {
      throw new NotFoundException(`MND symptom ${symptomId} not found`);
    }
  }

  private async ensureNextSymptomExists(symptomId?: string): Promise<void> {
    if (!symptomId) {
      return;
    }
    await this.ensureSymptomExists(symptomId);
  }

  private async ensureNextStacksExist(
    stacks?: MndMatrixRuleStackDto[],
  ): Promise<void> {
    if (!stacks) {
      return;
    }
    await this.ensureStacksExist(stacks);
  }

  private async ensureStacksExist(
    stacks: MndMatrixRuleStackDto[],
  ): Promise<void> {
    const ids = [...new Set(stacks.map((stack) => stack.masterStackId))];
    if (ids.length !== stacks.length) {
      throw new BadRequestException('MND matrix stacks must be unique');
    }
    const existing = await this.stackRepository.findByIds(ids);
    if (existing.length !== ids.length) {
      throw new NotFoundException('One or more MND master stacks not found');
    }
  }

  private nextStacks(
    rule: MndMatrixRule,
    dto: UpdateMndMatrixRuleDto,
  ): MndMatrixRuleStack[] {
    if (dto.stacks) {
      return this.buildStacks(dto.stacks);
    }
    return rule.stacks.map((stack) => this.cloneStack(stack));
  }

  private buildStacks(items: MndMatrixRuleStackDto[]): MndMatrixRuleStack[] {
    return items.map((item) =>
      this.ruleRepository.createStack({
        masterStackId: item.masterStackId,
        priority: item.priority ?? 0,
      }),
    );
  }

  private cloneStack(stack: MndMatrixRuleStack): MndMatrixRuleStack {
    return this.ruleRepository.createStack({
      masterStackId: stack.masterStackId,
      priority: stack.priority,
    });
  }
}
