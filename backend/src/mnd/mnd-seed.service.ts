import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MND_EXERCISE_SEED_ROWS,
  MND_MASTER_STACK_SEED_ROWS,
  MND_MATRIX_RULE_SEED_ROWS,
  MND_SYMPTOM_SEED_ROWS,
} from '../common/constants/mnd-seed.constant';
import { MND_SEED_ENV_KEYS } from '../common/constants/mnd-seed-env-keys.constant';
import { MndMasterStack } from '../common/entity/mnd-master-stack.entity';
import { MndMatrixRuleStack } from '../common/entity/mnd-matrix-rule-stack.entity';
import { MndMatrixRule } from '../common/entity/mnd-matrix-rule.entity';
import { buildI18nText } from '../common/helpers/build-i18n-text.helper';
import type {
  MndMasterStackSeedRow,
  MndMatrixRuleSeedRow,
} from '../common/types/mnd-seed.type';
import { MndMasterStackRepository } from './repositories/mnd-master-stack.repository';
import { MndMatrixRuleRepository } from './repositories/mnd-matrix-rule.repository';
import { MndSymptomRepository } from './repositories/mnd-symptom.repository';
import { MndExerciseRepository } from './repositories/mnd-exercise.repository';

@Injectable()
export class MndSeedService implements OnModuleInit {
  private readonly logger = new Logger(MndSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly stackRepository: MndMasterStackRepository,
    private readonly symptomRepository: MndSymptomRepository,
    private readonly ruleRepository: MndMatrixRuleRepository,
    private readonly exerciseRepository: MndExerciseRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.isSeedEnabled()) {
      this.logger.log('MND seed skipped (SEED_MND_CONTENT off)');
      return;
    }
    await this.seedIfNeeded();
  }

  async seedIfNeeded(): Promise<void> {
    const stacks = await this.seedStacks();
    await this.seedSymptoms();
    await this.seedRules(stacks);
    await this.seedExercises();
  }

  private isSeedEnabled(): boolean {
    const raw = this.configService
      .get<string | undefined>(MND_SEED_ENV_KEYS.ENABLED)
      ?.trim()
      .toLowerCase();
    if (raw === undefined || raw.length === 0) {
      return true;
    }
    return raw === 'true' || raw === '1';
  }

  private async seedStacks(): Promise<Map<string, MndMasterStack>> {
    let created = 0;
    const stacksByCode = new Map<string, MndMasterStack>();
    for (const row of MND_MASTER_STACK_SEED_ROWS) {
      const existing = await this.stackRepository.findById(row.id);
      const stack = existing ?? (await this.createStack(row));
      stacksByCode.set(row.code, stack);
      if (!existing) {
        created += 1;
      }
    }
    this.logCreated('MND master stacks', created);
    return stacksByCode;
  }

  private async createStack(
    row: MndMasterStackSeedRow,
  ): Promise<MndMasterStack> {
    const stack = this.stackRepository.create({
      id: row.id,
      code: row.code,
      title: buildI18nText(row.titleRu),
      description: buildI18nText(row.descriptionRu),
      order: row.order,
      isActive: true,
    });
    return this.stackRepository.save(stack);
  }

  private async seedSymptoms(): Promise<void> {
    let created = 0;
    for (const row of MND_SYMPTOM_SEED_ROWS) {
      const existing = await this.symptomRepository.findById(row.id);
      if (existing) {
        continue;
      }
      const symptom = this.symptomRepository.create({
        id: row.id,
        code: row.code,
        title: buildI18nText(row.titleRu),
        description: buildI18nText(row.descriptionRu),
        neurophysiologicalRoot: buildI18nText(row.neurophysiologicalRootRu),
        order: row.order,
        isPublished: true,
      });
      await this.symptomRepository.save(symptom);
      created += 1;
    }
    this.logCreated('MND symptoms', created);
  }

  private async seedRules(
    stacksByCode: Map<string, MndMasterStack>,
  ): Promise<void> {
    let created = 0;
    for (const row of MND_MATRIX_RULE_SEED_ROWS) {
      const existing = await this.ruleRepository.findByIdWithRelations(row.id);
      if (existing) {
        continue;
      }
      const rule = this.ruleRepository.create({
        id: row.id,
        symptomId: row.symptomId,
        targetAction: buildI18nText(row.targetActionRu),
        bottomUpPercent: row.bottomUpPercent,
        topDownPercent: row.topDownPercent,
      });
      await this.ruleRepository.saveWithStacks(
        rule,
        this.buildRuleStacks(row, stacksByCode),
      );
      created += 1;
    }
    this.logCreated('MND matrix rules', created);
  }

  private async seedExercises(): Promise<void> {
    let created = 0;
    let synced = 0;
    for (const row of MND_EXERCISE_SEED_ROWS) {
      const existing = await this.exerciseRepository.findById(row.id);
      const title = buildI18nText(row.titleRu);
      if (existing) {
        existing.masterStackId = row.masterStackId;
        existing.direction = row.direction;
        existing.complexityLevel = row.complexityLevel;
        existing.title = title;
        existing.order = row.order;
        existing.isPublished = true;
        await this.exerciseRepository.save(existing);
        synced += 1;
        continue;
      }
      const exercise = this.exerciseRepository.create({
        id: row.id,
        masterStackId: row.masterStackId,
        direction: row.direction,
        complexityLevel: row.complexityLevel,
        title,
        content: null,
        order: row.order,
        isPublished: true,
      });
      await this.exerciseRepository.save(exercise);
      created += 1;
    }
    this.logCreated('MND exercises', created);
    if (synced > 0) {
      this.logger.log(`MND exercises synced from seed: ${String(synced)}`);
    }
  }

  private buildRuleStacks(
    row: MndMatrixRuleSeedRow,
    stacksByCode: Map<string, MndMasterStack>,
  ): MndMatrixRuleStack[] {
    return row.stackCodes.map((code, priority) => {
      const stack = stacksByCode.get(code);
      if (!stack) {
        throw new Error(`MND seed stack ${code} not found`);
      }
      return this.ruleRepository.createStack({
        masterStackId: stack.id,
        priority,
      });
    });
  }

  private logCreated(label: string, created: number): void {
    if (created === 0) {
      return;
    }
    this.logger.log(`${label} created: ${String(created)}`);
  }
}
