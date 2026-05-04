import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ONBOARDING_CATEGORY_SEED_IDS } from '../common/constants/onboarding-category-seed-ids.constant';
import {
  ONBOARDING_CATEGORY_SEED_ROWS,
  ONBOARDING_CATEGORY_SEED_TAG,
} from '../common/constants/onboarding-category-seed.constant';
import { ONBOARDING_SEED_ENV_KEYS } from '../common/constants/onboarding-seed-env-keys.constant';
import { CategoryCatalogAudience } from '../common/enums/category-catalog-audience.enum';
import type { LocalizedText } from '../common/types/localized-text.type';
import { CategoryRepository } from '../content-builder/category/category.repository';

function isSeedEnabled(configService: ConfigService): boolean {
  const raw = configService
    .get<string | undefined>(ONBOARDING_SEED_ENV_KEYS.ENABLED)
    ?.trim()
    .toLowerCase();
  if (raw === undefined || raw.length === 0) {
    return true;
  }
  return raw === 'true' || raw === '1';
}

function buildI18nText(ru: string): LocalizedText {
  return { ru, uk: ru, en: ru };
}

@Injectable()
export class OnboardingCategorySeedService implements OnModuleInit {
  private readonly logger = new Logger(OnboardingCategorySeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!isSeedEnabled(this.configService)) {
      this.logger.log('Onboarding category seed skipped (SEED_ONBOARDING_CATEGORIES off)');
      return;
    }
    await this.seedIfNeeded();
  }

  async seedIfNeeded(): Promise<void> {
    let created = 0;
    for (let i = 0; i < ONBOARDING_CATEGORY_SEED_ROWS.length; i += 1) {
      const row = ONBOARDING_CATEGORY_SEED_ROWS[i]!;
      const id = ONBOARDING_CATEGORY_SEED_IDS[i]!;
      const existing = await this.categoryRepository.findById(id);
      if (existing) {
        continue;
      }
      const titleRu = row.titleRu;
      const tags = [ONBOARDING_CATEGORY_SEED_TAG, `onboarding_${String(i + 1)}`];
      const entity = this.categoryRepository.create({
        id,
        title: buildI18nText(titleRu),
        description: buildI18nText(
          `Категория «${titleRu}» — материалы по этой теме.`,
        ),
        order: row.order,
        isPublished: true,
        catalogAudience: CategoryCatalogAudience.PRODUCTION,
        catalogFeatureFlagKey: null,
        tags,
      });
      await this.categoryRepository.save(entity);
      created += 1;
    }
    if (created > 0) {
      this.logger.log(`Onboarding categories created: ${String(created)}`);
    }
  }
}
