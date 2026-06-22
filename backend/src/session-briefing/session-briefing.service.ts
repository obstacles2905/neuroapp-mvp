import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppUserRepository } from '../analytics/app-user.repository';
import { SessionBriefingVideo } from '../common/entity/session-briefing-video.entity';
import {
  SESSION_BRIEFING_PHASES,
  SessionBriefingPhase,
} from '../common/enums/session-briefing-phase.enum';
import { AppMediaService } from '../media/app-media.service';
import { SessionBriefingAdminResponseDto } from './dto/session-briefing-admin-response.dto';
import { SessionBriefingPresentationResponseDto } from './dto/session-briefing-presentation-response.dto';
import { UpsertSessionBriefingDto } from './dto/upsert-session-briefing.dto';
import { SessionBriefingRepository } from './session-briefing.repository';

@Injectable()
export class SessionBriefingService {
  constructor(
    private readonly sessionBriefingRepository: SessionBriefingRepository,
    private readonly appUserRepository: AppUserRepository,
    private readonly appMediaService: AppMediaService,
  ) {}

  getAdminBriefing(phase: SessionBriefingPhase): Promise<SessionBriefingAdminResponseDto> {
    return this.loadAdminDto(phase);
  }

  async upsertAdminBriefing(
    phase: SessionBriefingPhase,
    dto: UpsertSessionBriefingDto,
  ): Promise<SessionBriefingAdminResponseDto> {
    let row = await this.sessionBriefingRepository.findByPhase(phase);
    if (row == null) {
      row = this.sessionBriefingRepository.create({
        phase,
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
        'Нельзя опубликовать видео без загруженного файла',
      );
    }
    const saved = await this.sessionBriefingRepository.save(row);
    return this.toAdminDto(phase, saved);
  }

  async clearAdminBriefing(
    phase: SessionBriefingPhase,
  ): Promise<SessionBriefingAdminResponseDto> {
    const row = await this.sessionBriefingRepository.findByPhase(phase);
    if (row != null) {
      await this.sessionBriefingRepository.remove(row);
    }
    return this.toAdminDto(phase, null);
  }

  async getPresentationForUser(
    userId: string,
    phase: SessionBriefingPhase,
  ): Promise<SessionBriefingPresentationResponseDto> {
    const user = await this.appUserRepository.findById(userId);
    if (user == null) {
      throw new UnauthorizedException();
    }
    const row = await this.sessionBriefingRepository.findByPhase(phase);
    if (row == null || !row.isPublished || row.s3Key == null) {
      return { slide: null };
    }
    return {
      slide: {
        id: row.id,
        mediaUrl: this.appMediaService.buildStreamUrl(row.s3Key),
      },
    };
  }

  async completeForUser(userId: string, phase: SessionBriefingPhase): Promise<void> {
    const user = await this.appUserRepository.findById(userId);
    if (user == null) {
      throw new UnauthorizedException();
    }
    if (phase === SessionBriefingPhase.GREETING) {
      if (user.sessionGreetingSeenAt != null) {
        return;
      }
      user.sessionGreetingSeenAt = new Date();
    } else {
      if (user.sessionFinalWordSeenAt != null) {
        return;
      }
      user.sessionFinalWordSeenAt = new Date();
    }
    await this.appUserRepository.save(user);
  }

  assertValidPhase(raw: string): SessionBriefingPhase {
    if (!SESSION_BRIEFING_PHASES.includes(raw as SessionBriefingPhase)) {
      throw new BadRequestException('Invalid session briefing phase');
    }
    return raw as SessionBriefingPhase;
  }

  private async loadAdminDto(
    phase: SessionBriefingPhase,
  ): Promise<SessionBriefingAdminResponseDto> {
    const row = await this.sessionBriefingRepository.findByPhase(phase);
    return this.toAdminDto(phase, row);
  }

  private toAdminDto(
    phase: SessionBriefingPhase,
    row: SessionBriefingVideo | null,
  ): SessionBriefingAdminResponseDto {
    const s3Key = row?.s3Key ?? null;
    return {
      phase,
      id: row?.id ?? null,
      s3Key,
      mediaUrl: s3Key != null ? this.appMediaService.buildStreamUrl(s3Key) : null,
      isPublished: row?.isPublished ?? false,
    };
  }
}
