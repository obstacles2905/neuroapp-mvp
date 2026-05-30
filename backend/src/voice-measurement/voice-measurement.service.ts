import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUserVoiceMeasurementSession } from '../common/entity/app-user-voice-measurement-session.entity';
import type { SubmitVoiceMeasurementDto } from './dto/submit-voice-measurement.dto';

@Injectable()
export class VoiceMeasurementService {
  constructor(
    @InjectRepository(AppUserVoiceMeasurementSession)
    private readonly voiceRepo: Repository<AppUserVoiceMeasurementSession>,
  ) {}

  async upsertAggregate(
    appUserId: string,
    dto: SubmitVoiceMeasurementDto,
  ): Promise<void> {
    let row = await this.voiceRepo.findOne({
      where: { appUserId, sessionId: dto.id },
    });
    if (row == null) {
      row = this.voiceRepo.create({
        appUserId,
        sessionId: dto.id,
      });
    }
    row.capturedAt = new Date(dto.capturedAt);
    row.durationMs = dto.durationMs;
    row.extractorId = dto.extractorId;
    row.extractorVersion = dto.extractorVersion;
    row.featureSet = dto.featureSet;
    row.interpretation = dto.interpretation ?? null;
    row.coreMetrics = dto.coreMetrics ?? null;
    row.comparison = dto.comparison ?? null;
    row.acousticSnapshot = dto.acousticSnapshot ?? null;
    row.metrics = dto.metrics;
    row.protocolVersion = dto.protocolVersion;
    row.quality = dto.quality;
    row.scoringVersion = dto.scoringVersion;
    await this.voiceRepo.save(row);
  }
}
