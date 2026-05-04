import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module';
import { UserLessonProgress } from '../common/entity/user-lesson-progress.entity';
import { ActivityStreakController } from './activity-streak.controller';
import { ActivityStreakService } from './activity-streak.service';

@Module({
  imports: [AnalyticsModule, TypeOrmModule.forFeature([UserLessonProgress])],
  controllers: [ActivityStreakController],
  providers: [ActivityStreakService],
  exports: [ActivityStreakService],
})
export class ActivityStreakModule {}
