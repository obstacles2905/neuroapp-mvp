import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserLessonProgressStatus } from '../common/enums/user-lesson-progress-status.enum';
import { maxDate } from '../common/helpers/max-date.helper';
import type { I18nJsonField } from '../common/types/i18n-json.type';
import { UsageTrackingRepository } from '../usage-tracking/usage-tracking.repository';
import { parseLocalDayRange } from '../usage-tracking/usage-tracking.logic';
import { AppUserRepository } from './app-user.repository';
import { AppUserDetailResponseDto } from './dto/app-user-detail-response.dto';
import { AppUserSummaryResponseDto } from './dto/app-user-summary-response.dto';
import { LessonProgressAnalyticsRowDto } from './dto/lesson-progress-analytics-row.dto';
import type { UsageDailyRowDto } from './dto/usage-daily-row.dto';
import {
  localDayDaysAgo,
  msStringToNumber,
  msToRoundedMinutes,
  resolveUsageTimeZone,
} from './usage-analytics.helper';

const DEFAULT_USAGE_RANGE_DAYS = 30;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly appUserRepository: AppUserRepository,
    private readonly usageTrackingRepository: UsageTrackingRepository,
  ) {}

  async listUsers(): Promise<AppUserSummaryResponseDto[]> {
    const users = await this.appUserRepository.findAllWithProgress();
    const totalsByUser = await this.loadTotalsMap(users.map((u) => u.id));
    return Promise.all(
      users.map(async (user) => {
        const totals = totalsByUser.get(user.id) ?? {
          totalAppMs: '0',
          totalExerciseMs: '0',
        };
        const tz = resolveUsageTimeZone(user.usageTimezone);
        const sessionsLast7d =
          await this.usageTrackingRepository.sumSessionsSinceLocalDay(
            user.id,
            localDayDaysAgo(tz, 6),
          );
        return this.toSummary(user, totals, sessionsLast7d);
      }),
    );
  }

  async getUserDetail(
    id: string,
    fromLocalDay?: string,
    toLocalDay?: string,
  ): Promise<AppUserDetailResponseDto> {
    const user =
      await this.appUserRepository.findByIdWithProgressAndLessons(id);
    if (!user) {
      throw new NotFoundException(`App user ${id} not found`);
    }
    const tz = resolveUsageTimeZone(user.usageTimezone);
    const range = this.resolveUsageRange(fromLocalDay, toLocalDay, tz);
    const totals = await this.usageTrackingRepository.findTotalsForUser(id);
    const usageByDay = await this.usageTrackingRepository.findDailyInRange(
      id,
      range.from,
      range.to,
    );
    return this.toDetail(user, totals, usageByDay);
  }

  private async loadTotalsMap(
    userIds: string[],
  ): Promise<Map<string, { totalAppMs: string; totalExerciseMs: string }>> {
    const rows = await this.usageTrackingRepository.findTotalsForUsers(userIds);
    const map = new Map<string, { totalAppMs: string; totalExerciseMs: string }>();
    for (const row of rows) {
      map.set(row.appUserId, {
        totalAppMs: row.totalAppMs,
        totalExerciseMs: row.totalExerciseMs,
      });
    }
    return map;
  }

  private resolveUsageRange(
    from: string | undefined,
    to: string | undefined,
    timeZone: string,
  ): { from: string; to: string } {
    const today = localDayDaysAgo(timeZone, 0);
    const defaultFrom = localDayDaysAgo(timeZone, DEFAULT_USAGE_RANGE_DAYS - 1);
    const parsed = parseLocalDayRange(from ?? defaultFrom, to ?? today);
    if (parsed == null) {
      throw new BadRequestException('Invalid from/to local day (YYYY-MM-DD)');
    }
    return parsed;
  }

  private toSummary(
    user: {
      id: string;
      email: string | null;
      displayName: string | null;
      lastSeenAt: Date | null;
      progress: Array<{
        status: UserLessonProgressStatus;
        lastActiveAt: Date | null;
      }>;
    },
    totals: { totalAppMs: string; totalExerciseMs: string },
    sessionsLast7d: number,
  ): AppUserSummaryResponseDto {
    const lessonsCompleted = user.progress.filter(
      (p) => p.status === UserLessonProgressStatus.COMPLETED,
    ).length;
    const lessonsInProgress = user.progress.filter(
      (p) => p.status === UserLessonProgressStatus.IN_PROGRESS,
    ).length;
    const lastActive = maxDate(user.progress.map((p) => p.lastActiveAt));
    const totalAppMinutes = msToRoundedMinutes(msStringToNumber(totals.totalAppMs));
    const totalExerciseMinutes = msToRoundedMinutes(
      msStringToNumber(totals.totalExerciseMs),
    );
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      lessonsCompleted,
      lessonsInProgress,
      lastActiveAt: lastActive ? lastActive.toISOString() : null,
      totalAppMinutes,
      totalExerciseMinutes,
      lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
      sessionsLast7d,
    };
  }

  private toDetail(
    user: {
      id: string;
      email: string | null;
      displayName: string | null;
      createdAt: Date;
      usageTimezone: string | null;
      lastSeenAt: Date | null;
      progress: Array<{
        lessonId: string;
        status: UserLessonProgressStatus;
        percentComplete: number;
        lastActiveAt: Date | null;
        lesson: { title: I18nJsonField };
      }>;
    },
    totals: { totalAppMs: string; totalExerciseMs: string },
    usageByDay: Array<{
      localDay: string;
      appMs: string;
      exerciseMs: string;
      sessionCount: number;
    }>,
  ): AppUserDetailResponseDto {
    const progress: LessonProgressAnalyticsRowDto[] = user.progress.map(
      (row) => ({
        lessonId: row.lessonId,
        lessonTitle: { ...row.lesson.title },
        status: row.status,
        percentComplete: row.percentComplete,
        lastActiveAt: row.lastActiveAt ? row.lastActiveAt.toISOString() : null,
      }),
    );
    const totalAppMinutes = msToRoundedMinutes(msStringToNumber(totals.totalAppMs));
    const totalExerciseMinutes = msToRoundedMinutes(
      msStringToNumber(totals.totalExerciseMs),
    );
    const totalPassiveMinutes = Math.max(
      0,
      totalAppMinutes - totalExerciseMinutes,
    );
    const usageRows: UsageDailyRowDto[] = usageByDay.map((row) => ({
      localDay: row.localDay,
      appMs: msStringToNumber(row.appMs),
      exerciseMs: msStringToNumber(row.exerciseMs),
      sessionCount: row.sessionCount,
    }));
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
      progress,
      usageTimezone: user.usageTimezone,
      totalAppMinutes,
      totalExerciseMinutes,
      totalPassiveMinutes,
      lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
      usageByDay: usageRows,
    };
  }
}
