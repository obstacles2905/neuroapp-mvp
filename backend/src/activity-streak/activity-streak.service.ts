import { Repository } from 'typeorm';

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AppUserRepository } from '../analytics/app-user.repository';
import { AppUserMndExerciseCompletion } from '../common/entity/app-user-mnd-exercise-completion.entity';
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
    @InjectRepository(AppUserMndExerciseCompletion)
    private readonly mndCompletionRepository: Repository<AppUserMndExerciseCompletion>,
  ) {}

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

  private async fetchActiveUtcYyyyMmDdInMonth(
    appUserId: string,
    year: number,
    month: number,
  ): Promise<string[]> {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const from = `${year}-${pad(month)}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const to = `${year}-${pad(month)}-${pad(lastDay)}`;
    const rows = await this.mndCompletionRepository.query(
      `
      SELECT TO_CHAR(
        (c.first_completed_at AT TIME ZONE 'UTC')::date,
        'YYYY-MM-DD'
      ) AS day
      FROM app_user_mnd_exercise_completions c
      WHERE c.app_user_id = $1
        AND (c.first_completed_at AT TIME ZONE 'UTC')::date >= $2::date
        AND (c.first_completed_at AT TIME ZONE 'UTC')::date <= $3::date
      ORDER BY 1
      `,
      [appUserId, from, to],
    );
    return rows.map((r: { day: string }) => r.day);
  }
}
