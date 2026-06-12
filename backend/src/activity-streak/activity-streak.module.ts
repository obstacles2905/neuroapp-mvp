import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AppUserMndExerciseCompletion } from '../common/entity/app-user-mnd-exercise-completion.entity';
import { ActivityStreakController } from './activity-streak.controller';
import { ActivityStreakService } from './activity-streak.service';

@Module({
  imports: [
    AnalyticsModule,
    TypeOrmModule.forFeature([AppUserMndExerciseCompletion]),
  ],
  controllers: [ActivityStreakController],
  providers: [ActivityStreakService],
  exports: [ActivityStreakService],
})
export class ActivityStreakModule {}
