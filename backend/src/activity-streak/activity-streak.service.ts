import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUserRepository } from '../analytics/app-user.repository';
import { UserLessonProgress } from '../common/entity/user-lesson-progress.entity';
import {
  toUtcYyyyMmDd,
  utcYyyyMmDdYesterday,
} from '../common/helpers/utc-yyyy-mm-dd.helper';
import { ActivityCalendarResponseDto } from './dto/activity-calendar-response.dto';

@Injectable()
export class ActivityStreakService {
  constructor(
    private readonly appUserRepository: AppUserRepository,
    @InjectRepository(UserLessonProgress)
    private readonly progressRepository: Repository<UserLessonProgress>,
  ) {}

  /**
   * Один календарный день (UTC) = одно зачисление в стрик, даже при нескольких уроках.
   */
  async onQualifyingActivityDay(
    appUserId: string,
    now: Date = new Date(),
  ): Promise<void> {
    const user = await this.appUserRepository.findById(appUserId);
    if (user == null) {
      throw new UnauthorizedException();
    }
    const today = toUtcYyyyMmDd(now);
    const last = user.activityStreakLastUtcDate;
    if (last === today) {
      return;
    }
    const yesterday = utcYyyyMmDdYesterday(today);
    const nextCount =
      last == null ? 1 : last === yesterday ? user.activityStreakCount + 1 : 1;
    user.activityStreakCount = nextCount;
    user.activityStreakLastUtcDate = today;
    await this.appUserRepository.save(user);
  }

  async resetStreakTest(appUserId: string): Promise<void> {
    const user = await this.appUserRepository.findById(appUserId);
    if (user == null) {
      throw new UnauthorizedException();
    }
    user.activityStreakCount = 0;
    user.activityStreakLastUtcDate = null;
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
    return rows.map((r) => r.day);
  }
}
