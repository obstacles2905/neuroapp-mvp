import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionBriefingVideo } from '../common/entity/session-briefing-video.entity';
import { SessionBriefingPhase } from '../common/enums/session-briefing-phase.enum';

@Injectable()
export class SessionBriefingRepository {
  constructor(
    @InjectRepository(SessionBriefingVideo)
    private readonly repository: Repository<SessionBriefingVideo>,
  ) {}

  findByPhase(phase: SessionBriefingPhase): Promise<SessionBriefingVideo | null> {
    return this.repository.findOne({ where: { phase } });
  }

  create(data: Partial<SessionBriefingVideo>): SessionBriefingVideo {
    return this.repository.create(data);
  }

  save(entity: SessionBriefingVideo): Promise<SessionBriefingVideo> {
    return this.repository.save(entity);
  }

  async remove(entity: SessionBriefingVideo): Promise<void> {
    await this.repository.remove(entity);
  }
}
