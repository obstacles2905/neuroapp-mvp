import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { MndModule } from '../mnd/mnd.module';
import { MediaModule } from '../media/media.module';
import { ActivityStreakModule } from '../activity-streak/activity-streak.module';
import { AppOnboardingController } from './app-onboarding.controller';
import { AppOnboardingService } from './app-onboarding.service';
import { AppMndExerciseController } from './app-mnd-exercise.controller';
import { AppMndExerciseService } from './app-mnd-exercise.service';
import { AppMndSessionController } from './app-mnd-session.controller';

@Module({
  imports: [
    AnalyticsModule,
    AppAuthModule,
    MndModule,
    MediaModule,
    ActivityStreakModule,
  ],
  controllers: [
    AppOnboardingController,
    AppMndSessionController,
    AppMndExerciseController,
  ],
  providers: [AppOnboardingService, AppMndExerciseService],
})
export class AppOnboardingModule {}
