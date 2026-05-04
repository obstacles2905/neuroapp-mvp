import { Injectable } from '@nestjs/common';
import type { MndExerciseBlock } from '../common/entity/mnd-exercise-block.entity';
import type { MndExerciseStep } from '../common/entity/mnd-exercise-step.entity';
import type { MndExercise } from '../common/entity/mnd-exercise.entity';
import { LessonStepType } from '../common/enums/lesson-step-type.enum';
import type { AnimationStepContent } from '../common/interfaces/animation-step-content.interface';
import type { LessonStepContent } from '../common/interfaces/lesson-step-content.interface';
import type { VideoStepContent } from '../common/interfaces/video-step-content.interface';
import { utcDateKeyFromDate } from '../common/helpers/utc-date-key.helper';
import { S3Service } from '../media/s3.service';
import { AppUserMndExerciseCompletionRepository } from '../analytics/app-user-mnd-exercise-completion.repository';
import { AppUserMndJamExerciseDayCompletionRepository } from '../analytics/app-user-mnd-jam-exercise-day-completion.repository';
import { ActivityStreakService } from '../activity-streak/activity-streak.service';
import { MndExerciseService } from '../mnd/mnd-exercise.service';
import { AppLessonBlockResponseDto } from './dto/app-lesson-block-response.dto';
import { AppMndExerciseDetailResponseDto } from './dto/app-mnd-exercise-detail-response.dto';
import { AppLessonStepResponseDto } from './dto/app-lesson-step-response.dto';

@Injectable()
export class AppMndExerciseService {
  constructor(
    private readonly mndExerciseService: MndExerciseService,
    private readonly s3Service: S3Service,
    private readonly activityStreakService: ActivityStreakService,
    private readonly mndExerciseCompletionRepository: AppUserMndExerciseCompletionRepository,
    private readonly jamDayCompletionRepository: AppUserMndJamExerciseDayCompletionRepository,
  ) {}

  async getPublishedDetail(exerciseId: string): Promise<AppMndExerciseDetailResponseDto> {
    const exercise = await this.mndExerciseService.findOnePublishedForApp(exerciseId);
    return this.toDetailDto(exercise);
  }

  async recordComplete(
    appUserId: string,
    exerciseId: string,
    options?: { fromJam?: boolean },
  ): Promise<void> {
    await this.mndExerciseService.findOnePublishedForApp(exerciseId);
    await this.mndExerciseCompletionRepository.recordFirstCompletion(
      appUserId,
      exerciseId,
    );
    if (options?.fromJam === true) {
      const dayKeyUtc = utcDateKeyFromDate(new Date());
      await this.jamDayCompletionRepository.recordCompletion(
        appUserId,
        exerciseId,
        dayKeyUtc,
      );
    }
    await this.activityStreakService.onQualifyingActivityDay(appUserId);
  }

  private toDetailDto(exercise: MndExercise): AppMndExerciseDetailResponseDto {
    const code = exercise.masterStack?.code ?? '';
    return {
      id: exercise.id,
      title: exercise.title,
      order: exercise.order,
      direction: exercise.direction,
      masterStackCode: code,
      blocks: (exercise.blocks ?? []).map((b) => this.toBlockDto(b)),
    };
  }

  private toBlockDto(b: MndExerciseBlock): AppLessonBlockResponseDto {
    return {
      id: b.id,
      order: b.order,
      blockType: b.blockType,
      steps: (b.slides ?? []).map((s) => this.toStepDto(s)),
    };
  }

  private toStepDto(s: MndExerciseStep): AppLessonStepResponseDto {
    return {
      id: s.id,
      order: s.order,
      type: s.type,
      content: this.mapStepContent(s.type, s.content),
    };
  }

  private mapStepContent(
    type: LessonStepType,
    content: LessonStepContent,
  ): Record<string, unknown> {
    const c = { ...(content as unknown as Record<string, unknown>) };
    if (type === LessonStepType.VIDEO) {
      const v = content as VideoStepContent;
      c.mediaUrl = this.s3Service.getFileUrl(v.s3_key);
    }
    if (type === LessonStepType.ANIMATION) {
      const a = content as AnimationStepContent;
      c.mediaUrl = this.s3Service.getFileUrl(a.s3_key);
    }
    return c;
  }
}
