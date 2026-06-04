import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUserUsageDaily } from '../common/entity/app-user-usage-daily.entity';
import { AppUserUsageSegment } from '../common/entity/app-user-usage-segment.entity';
import { UsageSegmentKind } from '../common/enums/usage-segment-kind.enum';
import { addMsToBigintString } from './usage-tracking.logic';

export type UsageTotalsRow = {
  totalAppMs: string;
  totalExerciseMs: string;
};

export type UsageDailyRow = {
  localDay: string;
  appMs: string;
  exerciseMs: string;
  sessionCount: number;
};

@Injectable()
export class UsageTrackingRepository {
  constructor(
    @InjectRepository(AppUserUsageSegment)
    private readonly segmentRepository: Repository<AppUserUsageSegment>,
    @InjectRepository(AppUserUsageDaily)
    private readonly dailyRepository: Repository<AppUserUsageDaily>,
  ) {}

  findSegmentByClientEventId(
    appUserId: string,
    clientEventId: string,
  ): Promise<AppUserUsageSegment | null> {
    return this.segmentRepository.findOne({
      where: { appUserId, clientEventId },
    });
  }

  findLatestAppSegmentEndedAt(appUserId: string): Promise<Date | null> {
    return this.segmentRepository
      .findOne({
        where: { appUserId, kind: UsageSegmentKind.APP },
        order: { endedAt: 'DESC' },
        select: { endedAt: true },
      })
      .then((row) => row?.endedAt ?? null);
  }

  async insertSegment(
    segment: Partial<AppUserUsageSegment>,
  ): Promise<AppUserUsageSegment> {
    const entity = this.segmentRepository.create(segment);
    return this.segmentRepository.save(entity);
  }

  async addDailyMs(
    appUserId: string,
    localDay: string,
    appMsDelta: number,
    exerciseMsDelta: number,
    sessionDelta: number,
  ): Promise<void> {
    let row = await this.dailyRepository.findOne({
      where: { appUserId, localDay },
    });
    if (row == null) {
      row = this.dailyRepository.create({
        appUserId,
        localDay,
        appMs: '0',
        exerciseMs: '0',
        sessionCount: 0,
      });
    }
    if (appMsDelta > 0) {
      row.appMs = addMsToBigintString(row.appMs, appMsDelta);
    }
    if (exerciseMsDelta > 0) {
      row.exerciseMs = addMsToBigintString(row.exerciseMs, exerciseMsDelta);
    }
    if (sessionDelta > 0) {
      row.sessionCount += sessionDelta;
    }
    await this.dailyRepository.save(row);
  }

  findTotalsForUser(appUserId: string): Promise<UsageTotalsRow> {
    return this.dailyRepository
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.app_ms), 0)', 'totalAppMs')
      .addSelect('COALESCE(SUM(d.exercise_ms), 0)', 'totalExerciseMs')
      .where('d.app_user_id = :appUserId', { appUserId })
      .getRawOne<UsageTotalsRow>()
      .then(
        (row) =>
          row ?? {
            totalAppMs: '0',
            totalExerciseMs: '0',
          },
      );
  }

  findDailyInRange(
    appUserId: string,
    fromLocalDay: string,
    toLocalDay: string,
  ): Promise<UsageDailyRow[]> {
    return this.dailyRepository
      .createQueryBuilder('d')
      .select('d.local_day', 'localDay')
      .addSelect('d.app_ms', 'appMs')
      .addSelect('d.exercise_ms', 'exerciseMs')
      .addSelect('d.session_count', 'sessionCount')
      .where('d.app_user_id = :appUserId', { appUserId })
      .andWhere('d.local_day >= :fromLocalDay', { fromLocalDay })
      .andWhere('d.local_day <= :toLocalDay', { toLocalDay })
      .orderBy('d.local_day', 'ASC')
      .getRawMany<UsageDailyRow>();
  }

  findTotalsForUsers(
    appUserIds: string[],
  ): Promise<Array<{ appUserId: string } & UsageTotalsRow>> {
    if (appUserIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.dailyRepository
      .createQueryBuilder('d')
      .select('d.app_user_id', 'appUserId')
      .addSelect('COALESCE(SUM(d.app_ms), 0)', 'totalAppMs')
      .addSelect('COALESCE(SUM(d.exercise_ms), 0)', 'totalExerciseMs')
      .where('d.app_user_id IN (:...appUserIds)', { appUserIds })
      .groupBy('d.app_user_id')
      .getRawMany();
  }

  sumSessionsSinceLocalDay(
    appUserId: string,
    fromLocalDay: string,
  ): Promise<number> {
    return this.dailyRepository
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.session_count), 0)', 'cnt')
      .where('d.app_user_id = :appUserId', { appUserId })
      .andWhere('d.local_day >= :fromLocalDay', { fromLocalDay })
      .getRawOne<{ cnt: string }>()
      .then((row) => Number.parseInt(row?.cnt ?? '0', 10));
  }
}
