import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUserRepository } from '../analytics/app-user.repository';
import { AppUserUsageDaily } from '../common/entity/app-user-usage-daily.entity';
import { AppUserUsageSegment } from '../common/entity/app-user-usage-segment.entity';
import { AppUser } from '../common/entity/app-user.entity';
import { UsageTrackingController } from './usage-tracking.controller';
import { UsageTrackingRepository } from './usage-tracking.repository';
import { UsageTrackingService } from './usage-tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppUser,
      AppUserUsageSegment,
      AppUserUsageDaily,
    ]),
  ],
  controllers: [UsageTrackingController],
  providers: [
    AppUserRepository,
    UsageTrackingRepository,
    UsageTrackingService,
  ],
  exports: [UsageTrackingRepository],
})
export class UsageTrackingModule {}
