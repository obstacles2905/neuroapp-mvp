import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppUserRepository } from '../analytics/app-user.repository';
import {
  ARCHITECT_WORD_SLOT_NUMBERS,
} from '../common/constants/architect-word.constants';
import { ArchitectWordVideo } from '../common/entity/architect-word-video.entity';
import { buildArchitectWordPresentation } from '../common/helpers/build-architect-word-presentation.helper';
import { buildPrioritizedSymptomIdsFromRanks } from '../common/helpers/build-prioritized-symptom-ids-from-ranks.helper';
import type { I18nJsonField } from '../common/types/i18n-json.type';
import { AppMediaService } from '../media/app-media.service';
import { MndSymptomService } from '../mnd/mnd-symptom.service';
import { ArchitectWordRepository } from './architect-word.repository';
import { ArchitectWordAdminSlotResponseDto } from './dto/architect-word-admin-slot-response.dto';
import {
  ArchitectWordPresentationBlockDto,
  ArchitectWordPresentationResponseDto,
  ArchitectWordPresentationSlideDto,
} from './dto/architect-word-presentation-response.dto';
import { UpsertArchitectWordSlotDto } from './dto/upsert-architect-word-slot.dto';

@Injectable()
export class ArchitectWordService {
  constructor(
    private readonly architectWordRepository: ArchitectWordRepository,
    private readonly mndSymptomService: MndSymptomService,
    private readonly appUserRepository: AppUserRepository,
    private readonly appMediaService: AppMediaService,
  ) {}

  async listAdminSlots(symptomId: string): Promise<ArchitectWordAdminSlotResponseDto[]> {
    await this.mndSymptomService.findOne(symptomId);
    const rows = await this.architectWordRepository.findBySymptomId(symptomId);
    const bySlot = new Map(rows.map((row) => [row.slot, row]));
    return ARCHITECT_WORD_SLOT_NUMBERS.map((slot) => {
      const row = bySlot.get(slot);
      return this.toAdminSlotDto(slot, row);
    });
  }

  async upsertAdminSlot(
    symptomId: string,
    slot: number,
    dto: UpsertArchitectWordSlotDto,
  ): Promise<ArchitectWordAdminSlotResponseDto> {
    this.assertValidSlot(slot);
    await this.mndSymptomService.findOne(symptomId);
    let row = await this.architectWordRepository.findBySymptomIdAndSlot(
      symptomId,
      slot,
    );
    if (row == null) {
      row = this.architectWordRepository.create({
        symptomId,
        slot,
        s3Key: null,
        isPublished: false,
      });
    }
    if (dto.s3Key !== undefined) {
      row.s3Key = dto.s3Key.trim().length > 0 ? dto.s3Key.trim() : null;
    }
    if (dto.isPublished !== undefined) {
      row.isPublished = dto.isPublished;
    }
    if (row.isPublished && (row.s3Key == null || row.s3Key.length === 0)) {
      throw new BadRequestException(
        'Нельзя опубликовать слот без загруженного видео',
      );
    }
    const saved = await this.architectWordRepository.save(row);
    return this.toAdminSlotDto(slot, saved);
  }

  async clearAdminSlot(
    symptomId: string,
    slot: number,
  ): Promise<ArchitectWordAdminSlotResponseDto> {
    this.assertValidSlot(slot);
    await this.mndSymptomService.findOne(symptomId);
    const row = await this.architectWordRepository.findBySymptomIdAndSlot(
      symptomId,
      slot,
    );
    if (row != null) {
      await this.architectWordRepository.remove(row);
    }
    return this.toAdminSlotDto(slot, null);
  }

  async getPresentationForUser(
    userId: string,
    replay: boolean,
  ): Promise<ArchitectWordPresentationResponseDto> {
    const user = await this.appUserRepository.findById(userId);
    if (user == null) {
      throw new UnauthorizedException();
    }

    const prioritizedSymptomIds = buildPrioritizedSymptomIdsFromRanks(
      user.onboardingSymptomRanks,
    );
    if (prioritizedSymptomIds.length === 0) {
      return emptyPresentation();
    }

    const videos = await this.architectWordRepository.findBySymptomIds(
      prioritizedSymptomIds,
    );
    const videosBySymptomId = groupVideosBySymptomId(videos);
    const symptomTitles = await this.loadSymptomTitles(prioritizedSymptomIds);

    const useSnapshot =
      !replay &&
      user.architectWordSeenAt == null &&
      user.architectWordPlaylistSnapshot != null;

    const built = buildArchitectWordPresentation({
      prioritizedSymptomIds,
      videosBySymptomId,
      snapshot: useSnapshot ? user.architectWordPlaylistSnapshot : null,
    });

    if (!replay && user.architectWordSeenAt == null && built.snapshot != null) {
      user.architectWordPlaylistSnapshot = built.snapshot;
      await this.appUserRepository.save(user);
    }

    return this.toPresentationDto(built.blocks, symptomTitles);
  }

  async completeForUser(userId: string): Promise<void> {
    const user = await this.appUserRepository.findById(userId);
    if (user == null) {
      throw new UnauthorizedException();
    }
    if (user.architectWordSeenAt != null) {
      return;
    }
    user.architectWordSeenAt = new Date();
    user.architectWordPlaylistSnapshot = null;
    await this.appUserRepository.save(user);
  }

  private toAdminSlotDto(
    slot: number,
    row: ArchitectWordVideo | null | undefined,
  ): ArchitectWordAdminSlotResponseDto {
    const s3Key = row?.s3Key ?? null;
    return {
      slot,
      id: row?.id ?? null,
      s3Key,
      mediaUrl: s3Key != null ? this.appMediaService.buildStreamUrl(s3Key) : null,
      isPublished: row?.isPublished ?? false,
    };
  }

  private async loadSymptomTitles(
    symptomIds: string[],
  ): Promise<Map<string, I18nJsonField>> {
    const rows = await this.mndSymptomService.findByIds(symptomIds);
    const map = new Map<string, I18nJsonField>();
    for (const row of rows) {
      map.set(row.id, row.title);
    }
    return map;
  }

  private toPresentationDto(
    blocks: ReturnType<typeof buildArchitectWordPresentation>['blocks'],
    symptomTitles: Map<string, I18nJsonField>,
  ): ArchitectWordPresentationResponseDto {
    const blockDtos: ArchitectWordPresentationBlockDto[] = blocks.map(
      (block) => {
        const title = symptomTitles.get(block.symptomId);
        const symptomTitle = pickTitle(title);
        const slides = block.slides.map((slide) =>
          this.toSlideDto(slide, symptomTitle),
        );
        return {
          symptomId: block.symptomId,
          symptomTitle,
          slides,
        };
      },
    );
    const slides = blockDtos.flatMap((block) => block.slides);
    return {
      blocks: blockDtos,
      slides,
      skip: slides.length === 0,
    };
  }

  private toSlideDto(
    slide: {
      id: string;
      symptomId: string;
      slot: number;
      s3Key: string;
    },
    symptomTitle: string,
  ): ArchitectWordPresentationSlideDto {
    return {
      id: slide.id,
      symptomId: slide.symptomId,
      symptomTitle,
      slot: slide.slot,
      mediaUrl: this.appMediaService.buildStreamUrl(slide.s3Key),
    };
  }

  private assertValidSlot(slot: number): void {
    if (!ARCHITECT_WORD_SLOT_NUMBERS.includes(slot as 1 | 2)) {
      throw new BadRequestException('slot must be 1 or 2');
    }
  }
}

function emptyPresentation(): ArchitectWordPresentationResponseDto {
  return { blocks: [], slides: [], skip: true };
}

function groupVideosBySymptomId(
  videos: ArchitectWordVideo[],
): Map<string, ArchitectWordVideo[]> {
  const map = new Map<string, ArchitectWordVideo[]>();
  for (const row of videos) {
    const list = map.get(row.symptomId) ?? [];
    list.push(row);
    map.set(row.symptomId, list);
  }
  return map;
}

function pickTitle(title: I18nJsonField | undefined): string {
  if (title == null) {
    return '';
  }
  return title.ru || title.uk || title.en || '';
}
