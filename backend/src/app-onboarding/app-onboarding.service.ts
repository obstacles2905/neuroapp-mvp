import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppUserRepository } from '../analytics/app-user.repository';
import type { OnboardingSymptomRankItem } from '../common/types/onboarding-symptom-rank.type';
import { MndSymptomService } from '../mnd/mnd-symptom.service';
import { AppOnboardingSymptomListItemResponseDto } from './dto/app-onboarding-symptom-list-item-response.dto';
import { SubmitOnboardingDto } from './dto/submit-onboarding.dto';

@Injectable()
export class AppOnboardingService {
  constructor(
    private readonly appUserRepository: AppUserRepository,
    private readonly mndSymptomService: MndSymptomService,
  ) {}

  async listPublishedSymptoms(): Promise<
    AppOnboardingSymptomListItemResponseDto[]
  > {
    const rows = await this.mndSymptomService.findPublishedForOnboarding();
    return rows.map((s) => ({
      id: s.id,
      code: s.code,
      title: s.title,
      description: s.description,
      neurophysiologicalRoot: s.neurophysiologicalRoot,
      order: s.order,
    }));
  }

  async submit(userId: string, dto: SubmitOnboardingDto): Promise<void> {
    const validIds = new Set(
      (await this.mndSymptomService.findPublishedForOnboarding()).map(
        (s) => s.id,
      ),
    );
    const ids = dto.orderedSymptomIds;
    for (const id of ids) {
      if (!validIds.has(id)) {
        throw new BadRequestException('Неизвестный или недоступный симптом');
      }
    }
    const ranks: OnboardingSymptomRankItem[] = ids.map((symptomId, i) => ({
      symptomId,
      rank: i + 1,
      isActive: true,
    }));
    const user = await this.appUserRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    user.onboardingSymptomRanks = ranks;
    user.onboardingCategoryRanks = null;
    user.onboardingCompletedAt = new Date();
    user.onboardingSkippedAt = null;
    await this.appUserRepository.save(user);
  }

  async skip(userId: string): Promise<void> {
    const user = await this.appUserRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    user.onboardingSkippedAt = new Date();
    await this.appUserRepository.save(user);
  }

  async clearForReplay(userId: string): Promise<void> {
    const user = await this.appUserRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    user.onboardingCompletedAt = null;
    user.onboardingCategoryRanks = null;
    user.onboardingSymptomRanks = null;
    user.onboardingSkippedAt = null;
    await this.appUserRepository.save(user);
  }
}
