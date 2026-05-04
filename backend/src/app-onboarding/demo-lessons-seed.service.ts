import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonBlock } from '../common/entity/lesson-block.entity';
import { LessonStep } from '../common/entity/lesson-step.entity';
import {
  buildDemoSeedLessons,
  getDemoCategoryIdForIndex,
  LessonContentBlockType,
  LessonStatus,
  LessonStepType,
} from '../common/helpers/build-demo-seed-lessons.helper';
import { DEMO_LESSON_SEED_ENV_KEYS } from '../common/constants/demo-lesson-seed-env-keys.constant';
import type { TheoryStepContent } from '../common/interfaces/theory-step-content.interface';
import { CategoryRepository } from '../content-builder/category/category.repository';
import { LessonRepository } from '../content-builder/lesson/lesson.repository';
import { OnboardingCategorySeedService } from './onboarding-category-seed.service';

function isDemoSeedEnabled(configService: ConfigService): boolean {
  const raw = configService
    .get<string | undefined>(DEMO_LESSON_SEED_ENV_KEYS.ENABLED)
    ?.trim()
    .toLowerCase();
  if (raw === undefined || raw.length === 0) {
    return true;
  }
  return raw === 'true' || raw === '1';
}

function toTheory(a: string, b: string): TheoryStepContent {
  const lines = [a, b];
  return {
    display_mode: 'all',
    sentences: { ru: lines, uk: lines, en: lines },
  };
}

@Injectable()
export class DemoLessonsSeedService implements OnModuleInit {
  private readonly logger = new Logger(DemoLessonsSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly categoryRepository: CategoryRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly onboardingCategorySeed: OnboardingCategorySeedService,
    @InjectRepository(LessonBlock)
    private readonly lessonBlockRepo: Repository<LessonBlock>,
    @InjectRepository(LessonStep)
    private readonly lessonStepRepo: Repository<LessonStep>,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isDemoSeedEnabled(this.configService)) {
      this.logger.log('Demo lessons seed skipped (SEED_DEMO_LESSONS off)');
      return;
    }
    await this.onboardingCategorySeed.seedIfNeeded();
    await this.seedIfNeeded();
  }

  async seedIfNeeded(): Promise<void> {
    const plans = buildDemoSeedLessons();
    let created = 0;
    for (const def of plans) {
      const existing = await this.lessonRepository.findById(def.id);
      if (existing) {
        continue;
      }
      const categoryId = getDemoCategoryIdForIndex(def.categoryIndex);
      const category = await this.categoryRepository.findById(categoryId);
      if (category == null) {
        this.logger.warn(
          `Demo lesson ${def.id}: category ${categoryId} missing, skip`,
        );
        continue;
      }
      const lesson = this.lessonRepository.create({
        id: def.id,
        categoryId,
        title: def.title,
        status: LessonStatus.PUBLISHED,
        order: def.order,
      });
      await this.lessonRepository.save(lesson);
      const block = this.lessonBlockRepo.create({
        id: def.blockId,
        lessonId: def.id,
        blockType: LessonContentBlockType.WHAT_EXERCISE,
        order: 0,
      });
      await this.lessonBlockRepo.save(block);
      for (const st of def.steps) {
        const content = toTheory(st.line1, st.line2);
        const step = this.lessonStepRepo.create({
          id: st.id,
          lessonBlockId: def.blockId,
          order: st.order,
          type: LessonStepType.THEORY,
          content,
        });
        await this.lessonStepRepo.save(step);
      }
      created += 1;
    }
    if (created > 0) {
      this.logger.log(`Demo lessons created: ${String(created)}`);
    }
  }
}
