import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppUserMndExerciseCompletion } from '../common/entity/app-user-mnd-exercise-completion.entity';
import { AppUserMndJamExerciseDayCompletion } from '../common/entity/app-user-mnd-jam-exercise-day-completion.entity';
import { AppUser } from '../common/entity/app-user.entity';
import { UserLessonProgress } from '../common/entity/user-lesson-progress.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AppUserMndExerciseCompletionRepository } from './app-user-mnd-exercise-completion.repository';
import { AppUserMndJamExerciseDayCompletionRepository } from './app-user-mnd-jam-exercise-day-completion.repository';
import { AppUserRepository } from './app-user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppUser,
      UserLessonProgress,
      AppUserMndExerciseCompletion,
      AppUserMndJamExerciseDayCompletion,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [
    AppUserRepository,
    AppUserMndExerciseCompletionRepository,
    AppUserMndJamExerciseDayCompletionRepository,
    AnalyticsService,
  ],
  exports: [
    AppUserRepository,
    AppUserMndExerciseCompletionRepository,
    AppUserMndJamExerciseDayCompletionRepository,
  ],
})
export class AnalyticsModule {}
