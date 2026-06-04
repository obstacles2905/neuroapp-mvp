import { Repository } from 'typeorm';

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppUserRepository } from '../analytics/app-user.repository';
import { UserLessonProgress } from '../common/entity/user-lesson-progress.entity';
import {
  ActivityCalendarResponseDto,
} from './dto/activity-calendar-response.dto';
import {
  getEffectiveActivityStreakCount,
  isActivityStreakExpired,
  nextActivityStreakCountAfterCompletion,
} from './activity-streak.logic';

@Injectable()
export class ActivityStreakService {
  constructor(
    private readonly appUserRepository: AppUserRepository,
    @InjectRepository(UserLessonProgress)
    private readonly progressRepository: Repository<UserLessonProgress>,
  ) {}

  /**
   * Засчитывает стрик только при полном завершении упражнения (урок / MND).
   * Счётчик растёт, если новое завершение не позднее 24 ч после предыдущего;
   * иначе серия обрывается и начинается с 1.
   */
  async onQualifyingActivityCompletion(
    appUserId: string,
    now: Date = new Date(),
  ): Promise<void> {
    const user = await this.appUserRepository.findById(appUserId);
    if (user == null) {
      throw new UnauthorizedException();
    }
    const nextCount = nextActivityStreakCountAfterCompletion(
      user.activityStreakCount,
      user.activityStreakLastCompletedAt,
      now,
    );
    user.activityStreakCount = nextCount;
    user.activityStreakLastCompletedAt = now;
    await this.appUserRepository.save(user);
  }

  /** @deprecated alias for callers — same 24h completion rules */
  async onQualifyingActivityDay(
    appUserId: string,
    now?: Date,
  ): Promise<void> {
    return this.onQualifyingActivityCompletion(appUserId, now);
  }

  resolveEffectiveStreak(
    storedCount: number,
    lastCompletedAt: Date | string | null,
    now: Date = new Date(),
  ): number {
    return getEffectiveActivityStreakCount(
      storedCount,
      lastCompletedAt,
      now,
    );
  }

  /**
   * Обнуляет просроченный стрик в БД (например при GET /me).
   */
  async persistExpiredStreakIfNeeded(
    appUserId: string,
    now: Date = new Date(),
  ): Promise<void> {
    const user = await this.appUserRepository.findById(appUserId);
    if (user == null) {
      throw new UnauthorizedException();
    }
    if (
      user.activityStreakCount <= 0 ||
      user.activityStreakLastCompletedAt == null
    ) {
      return;
    }
    if (!isActivityStreakExpired(user.activityStreakLastCompletedAt, now)) {
      return;
    }
    user.activityStreakCount = 0;
    await this.appUserRepository.save(user);
  }

  async resetStreakTest(appUserId: string): Promise<void> {
    const user = await this.appUserRepository.findById(appUserId);
    if (user == null) {
      throw new UnauthorizedException();
    }
    user.activityStreakCount = 0;
    user.activityStreakLastCompletedAt = null;
    await this.appUserRepository.save(user);
  }

  async getActivityCalendar(
    appUserId: string,
    year: number,
    month: number,
  ): Promise<ActivityCalendarResponseDto> {
    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      throw new BadRequestException('Invalid year or month');
    }
    const activeDays = await this.fetchActiveUtcYyyyMmDdInMonth(
      appUserId,
      year,
      month,
    );
    return {
      activeDays,
      daysPracticedInMonth: activeDays.length,
    };
  }

  /**
   * Дни с активностью (UTC): завершённые уроки и впервые завершённые MND-упражнения.
   */
  private async fetchActiveUtcYyyyMmDdInMonth(
    appUserId: string,
    year: number,
    month: number,
  ): Promise<string[]> {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const from = `${year}-${pad(month)}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const to = `${year}-${pad(month)}-${pad(lastDay)}`;
    const rows = await this.progressRepository.query(
      `
      SELECT day
      FROM (
        SELECT TO_CHAR(
          (p.lesson_completed_at AT TIME ZONE 'UTC')::date,
          'YYYY-MM-DD'
        ) AS day
        FROM user_lesson_progress p
        WHERE p.app_user_id = $1
          AND p.lesson_completed_at IS NOT NULL
          AND (p.lesson_completed_at AT TIME ZONE 'UTC')::date >= $2::date
          AND (p.lesson_completed_at AT TIME ZONE 'UTC')::date <= $3::date
        UNION
        SELECT TO_CHAR(
          (c.first_completed_at AT TIME ZONE 'UTC')::date,
          'YYYY-MM-DD'
        ) AS day
        FROM app_user_mnd_exercise_completions c
        WHERE c.app_user_id = $1
          AND (c.first_completed_at AT TIME ZONE 'UTC')::date >= $2::date
          AND (c.first_completed_at AT TIME ZONE 'UTC')::date <= $3::date
      ) AS u
      WHERE u.day IS NOT NULL
      ORDER BY 1
      `,
      [appUserId, from, to],
    );
    return rows.map((r: { day: string }) => r.day);
  }
}
