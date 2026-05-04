import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MndMatrixRule } from '../../common/entity/mnd-matrix-rule.entity';
import { MndMatrixRuleStack } from '../../common/entity/mnd-matrix-rule-stack.entity';

@Injectable()
export class MndMatrixRuleRepository {
  constructor(
    @InjectRepository(MndMatrixRule)
    private readonly repository: Repository<MndMatrixRule>,
    @InjectRepository(MndMatrixRuleStack)
    private readonly stackRepository: Repository<MndMatrixRuleStack>,
  ) {}

  findAllWithRelations(): Promise<MndMatrixRule[]> {
    return this.repository.find({
      relations: { symptom: true, stacks: { masterStack: true } },
      order: { symptom: { order: 'ASC' }, stacks: { priority: 'ASC' } },
    });
  }

  findByIdWithRelations(id: string): Promise<MndMatrixRule | null> {
    return this.repository.findOne({
      where: { id },
      relations: { symptom: true, stacks: { masterStack: true } },
      order: { stacks: { priority: 'ASC' } },
    });
  }

  findBySymptomIdsWithStacks(symptomIds: string[]): Promise<MndMatrixRule[]> {
    if (symptomIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.repository.find({
      where: { symptomId: In(symptomIds) },
      relations: { stacks: { masterStack: true } },
    });
  }

  async saveWithStacks(
    rule: MndMatrixRule,
    stacks: MndMatrixRuleStack[],
  ): Promise<MndMatrixRule> {
    return this.repository.manager.transaction(async (manager) => {
      const saved = await manager.save(MndMatrixRule, rule);
      await manager.delete(MndMatrixRuleStack, { ruleId: saved.id });
      await manager.save(
        MndMatrixRuleStack,
        stacks.map((stack) => ({ ...stack, ruleId: saved.id })),
      );
      return manager.findOneOrFail(MndMatrixRule, {
        where: { id: saved.id },
        relations: { symptom: true, stacks: { masterStack: true } },
        order: { stacks: { priority: 'ASC' } },
      });
    });
  }

  async remove(entity: MndMatrixRule): Promise<void> {
    await this.repository.remove(entity);
  }

  create(data: Partial<MndMatrixRule>): MndMatrixRule {
    return this.repository.create(data);
  }

  createStack(data: Partial<MndMatrixRuleStack>): MndMatrixRuleStack {
    return this.stackRepository.create(data);
  }
}
