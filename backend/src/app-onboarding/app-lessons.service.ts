import { Injectable, NotFoundException } from '@nestjs/common';
import { UserLessonProgress } from '../common/entity/user-lesson-progress.entity';
import type { Lesson } from '../common/entity/lesson.entity';
import type { LessonBlock } from '../common/entity/lesson-block.entity';
import type { LessonStep } from '../common/entity/lesson-step.entity';
import { LessonStatus } from '../common/enums/lesson-status.enum';
import { LessonStepType } from '../common/enums/lesson-step-type.enum';
import { UserLessonProgressStatus } from '../common/enums/user-lesson-progress-status.enum';
import type { AnimationStepContent } from '../common/interfaces/animation-step-content.interface';
import type { LessonStepContent } from '../common/interfaces/lesson-step-content.interface';
import type { VideoStepContent } from '../common/interfaces/video-step-content.interface';
import { S3Service } from '../media/s3.service';
import { CategoryRepository } from '../content-builder/category/category.repository';
import { LessonRepository } from '../content-builder/lesson/lesson.repository';
import { ActivityStreakService } from '../activity-streak/activity-streak.service';
import { AppLessonProgressRepository } from './app-lesson-progress.repository';
import { AppLessonBlockResponseDto } from './dto/app-lesson-block-response.dto';
import { AppLessonDetailResponseDto } from './dto/app-lesson-detail-response.dto';
import { AppLessonListItemResponseDto } from './dto/app-lesson-list-item-response.dto';
import { AppLessonProgressSnapshotResponseDto } from './dto/app-lesson-progress-snapshot-response.dto';
import { AppLessonStepResponseDto } from './dto/app-lesson-step-response.dto';
import { UpdateAppLessonProgressDto } from './dto/update-app-lesson-progress.dto';

@Injectable()
export class AppLessonsService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly appLessonProgressRepository: AppLessonProgressRepository,
    private readonly s3Service: S3Service,
    private readonly activityStreakService: ActivityStreakService,
  ) {}

  async listByCategory(
    appUserId: string,
    categoryId: string,
  ): Promise<AppLessonListItemResponseDto[]> {
    const category =
      await this.categoryRepository.findPublishedProductionById(categoryId);
    if (!category) {
      throw new NotFoundException();
    }
    const lessons =
      await this.lessonRepository.findPublishedByCategoryId(categoryId);
    const lessonIds = lessons.map((l) => l.id);
    const progressRows =
      await this.appLessonProgressRepository.findByAppUserIdAndLessonIds(
        appUserId,
        lessonIds,
      );
    const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));
    return lessons.map((l) => ({
      id: l.id,
      title: l.title,
      order: l.order,
      progress: this.toProgressSnapshot(progressByLesson.get(l.id)),
    }));
  }

  async getById(
    appUserId: string,
    lessonId: string,
  ): Promise<AppLessonDetailResponseDto> {
    const lesson = await this.lessonRepository.findByIdWithRelations(lessonId);
    if (!lesson || !lesson.category) {
      throw new NotFoundException();
    }
    const category = await this.categoryRepository.findPublishedProductionById(
      lesson.categoryId,
    );
    if (!category) {
      throw new NotFoundException();
    }
    if (lesson.status !== LessonStatus.PUBLISHED) {
      throw new NotFoundException();
    }
    this.sortLessonContentTree(lesson);
    const p = await this.appLessonProgressRepository.findByUserAndLesson(
      appUserId,
      lessonId,
    );
    return {
      id: lesson.id,
      categoryId: lesson.categoryId,
      title: lesson.title,
      order: lesson.order,
      blocks: (lesson.blocks ?? []).map((b) => this.toBlockDto(b)),
      progress: this.toProgressSnapshot(p),
    };
  }

  async updateProgress(
    appUserId: string,
    lessonId: string,
    dto: UpdateAppLessonProgressDto,
  ): Promise<AppLessonProgressSnapshotResponseDto> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException();
    }
    const category = await this.categoryRepository.findPublishedProductionById(
      lesson.categoryId,
    );
    if (!category || lesson.status !== LessonStatus.PUBLISHED) {
      throw new NotFoundException();
    }
    let row = await this.appLessonProgressRepository.findByUserAndLesson(
      appUserId,
      lessonId,
    );
    if (!row) {
      row = this.appLessonProgressRepository.create({
        appUserId,
        lessonId,
        status: UserLessonProgressStatus.NOT_STARTED,
        percentComplete: 0,
        lastViewedStepId: null,
        lastActiveAt: new Date(),
        lessonCompletedAt: null,
      });
    }
    row.status = dto.status;
    row.percentComplete = dto.percentComplete;
    row.lastViewedStepId = dto.lastViewedStepId ?? null;
    row.lastActiveAt = new Date();
    if (dto.status === UserLessonProgressStatus.COMPLETED) {
      if (row.lessonCompletedAt == null) {
        row.lessonCompletedAt = new Date();
      }
    }
    const saved = await this.appLessonProgressRepository.save(row);
    if (dto.status === UserLessonProgressStatus.COMPLETED) {
      await this.activityStreakService.onQualifyingActivityDay(appUserId);
    }
    return this.toProgressSnapshot(saved)!;
  }

  private sortLessonContentTree(lesson: Lesson): void {
    if (!lesson.blocks?.length) {
      return;
    }
    lesson.blocks = [...lesson.blocks].sort((a, b) => a.order - b.order);
    for (const block of lesson.blocks) {
      if (block.slides?.length) {
        block.slides = [...block.slides].sort((a, b) => a.order - b.order);
      }
    }
  }

  private toBlockDto(b: LessonBlock): AppLessonBlockResponseDto {
    return {
      id: b.id,
      order: b.order,
      blockType: b.blockType,
      steps: (b.slides ?? []).map((s) => this.toStepDto(s)),
    };
  }

  private toStepDto(s: LessonStep): AppLessonStepResponseDto {
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

  private toProgressSnapshot(
    p: UserLessonProgress | null | undefined,
  ): AppLessonProgressSnapshotResponseDto | null {
    if (p == null) {
      return null;
    }
    return {
      status: p.status,
      percentComplete: p.percentComplete,
      lastViewedStepId: p.lastViewedStepId,
      lastActiveAt: p.lastActiveAt?.toISOString() ?? null,
      lessonCompletedAt: p.lessonCompletedAt?.toISOString() ?? null,
    };
  }
}
