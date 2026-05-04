import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { ContentBuilderModule } from '../content-builder/content-builder.module';
import { MndModule } from '../mnd/mnd.module';
import { LessonBlock, LessonStep } from '../common/entity';
import { UserLessonProgress } from '../common/entity/user-lesson-progress.entity';
import { MediaModule } from '../media/media.module';
import { ActivityStreakModule } from '../activity-streak/activity-streak.module';
import { DemoLessonsSeedService } from './demo-lessons-seed.service';
import { AppCatalogController } from './app-catalog.controller';
import { AppCatalogService } from './app-catalog.service';
import { AppLessonProgressRepository } from './app-lesson-progress.repository';
import { AppLessonsController } from './app-lessons.controller';
import { AppLessonsService } from './app-lessons.service';
import { AppOnboardingController } from './app-onboarding.controller';
import { AppOnboardingService } from './app-onboarding.service';
import { AppMndExerciseController } from './app-mnd-exercise.controller';
import { AppMndExerciseService } from './app-mnd-exercise.service';
import { AppMndSessionController } from './app-mnd-session.controller';
import { OnboardingCategorySeedService } from './onboarding-category-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserLessonProgress, LessonBlock, LessonStep]),
    AnalyticsModule,
    ContentBuilderModule,
    AppAuthModule,
    MndModule,
    MediaModule,
    ActivityStreakModule,
  ],
  controllers: [
    AppCatalogController,
    AppOnboardingController,
    AppMndSessionController,
    AppMndExerciseController,
    AppLessonsController,
  ],
  providers: [
    AppCatalogService,
    AppLessonsService,
    AppLessonProgressRepository,
    AppOnboardingService,
    AppMndExerciseService,
    OnboardingCategorySeedService,
    DemoLessonsSeedService,
  ],
})
export class AppOnboardingModule {}
