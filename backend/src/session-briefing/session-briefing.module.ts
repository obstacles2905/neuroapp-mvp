import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SessionBriefingVideo } from '../common/entity/session-briefing-video.entity';
import { MediaModule } from '../media/media.module';
import { SessionBriefingAdminController } from './session-briefing-admin.controller';
import { SessionBriefingAppController } from './session-briefing-app.controller';
import { SessionBriefingRepository } from './session-briefing.repository';
import { SessionBriefingService } from './session-briefing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionBriefingVideo]),
    AnalyticsModule,
    MediaModule,
  ],
  controllers: [SessionBriefingAdminController, SessionBriefingAppController],
  providers: [SessionBriefingRepository, SessionBriefingService],
})
export class SessionBriefingModule {}
