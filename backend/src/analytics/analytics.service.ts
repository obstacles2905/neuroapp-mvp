import { Injectable, NotFoundException } from '@nestjs/common';
import { UserLessonProgressStatus } from '../common/enums/user-lesson-progress-status.enum';
import { maxDate } from '../common/helpers/max-date.helper';
import type { I18nJsonField } from '../common/types/i18n-json.type';
import { AppUserRepository } from './app-user.repository';
import { AppUserDetailResponseDto } from './dto/app-user-detail-response.dto';
import { AppUserSummaryResponseDto } from './dto/app-user-summary-response.dto';
import { LessonProgressAnalyticsRowDto } from './dto/lesson-progress-analytics-row.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly appUserRepository: AppUserRepository) {}

  async listUsers(): Promise<AppUserSummaryResponseDto[]> {
    const users = await this.appUserRepository.findAllWithProgress();
    return users.map((user) => this.toSummary(user));
  }

  async getUserDetail(id: string): Promise<AppUserDetailResponseDto> {
    const user =
      await this.appUserRepository.findByIdWithProgressAndLessons(id);
    if (!user) {
      throw new NotFoundException(`App user ${id} not found`);
    }
    return this.toDetail(user);
  }

  private toSummary(user: {
    id: string;
    email: string | null;
    displayName: string | null;
    progress: Array<{
      status: UserLessonProgressStatus;
      lastActiveAt: Date | null;
    }>;
  }): AppUserSummaryResponseDto {
    const lessonsCompleted = user.progress.filter(
      (p) => p.status === UserLessonProgressStatus.COMPLETED,
    ).length;
    const lessonsInProgress = user.progress.filter(
      (p) => p.status === UserLessonProgressStatus.IN_PROGRESS,
    ).length;
    const lastActive = maxDate(user.progress.map((p) => p.lastActiveAt));
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      lessonsCompleted,
      lessonsInProgress,
      lastActiveAt: lastActive ? lastActive.toISOString() : null,
    };
  }

  private toDetail(user: {
    id: string;
    email: string | null;
    displayName: string | null;
    createdAt: Date;
    progress: Array<{
      lessonId: string;
      status: UserLessonProgressStatus;
      percentComplete: number;
      lastActiveAt: Date | null;
      lesson: { title: I18nJsonField };
    }>;
  }): AppUserDetailResponseDto {
    const progress: LessonProgressAnalyticsRowDto[] = user.progress.map(
      (row) => ({
        lessonId: row.lessonId,
        lessonTitle: { ...row.lesson.title },
        status: row.status,
        percentComplete: row.percentComplete,
        lastActiveAt: row.lastActiveAt ? row.lastActiveAt.toISOString() : null,
      }),
    );
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
      progress,
    };
  }
}
