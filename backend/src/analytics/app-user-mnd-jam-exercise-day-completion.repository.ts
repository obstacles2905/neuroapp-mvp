import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUserMndJamExerciseDayCompletion } from '../common/entity/app-user-mnd-jam-exercise-day-completion.entity';

@Injectable()
export class AppUserMndJamExerciseDayCompletionRepository {
  constructor(
    @InjectRepository(AppUserMndJamExerciseDayCompletion)
    private readonly repository: Repository<AppUserMndJamExerciseDayCompletion>,
  ) {}

  async recordCompletion(
    appUserId: string,
    mndExerciseId: string,
    dayKeyUtc: string,
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(AppUserMndJamExerciseDayCompletion)
      .values({ appUserId, mndExerciseId, dayKeyUtc })
      .orIgnore()
      .execute();
  }

  async findMndExerciseIdsCompletedOnDay(
    appUserId: string,
    dayKeyUtc: string,
  ): Promise<string[]> {
    const rows = await this.repository.find({
      where: { appUserId, dayKeyUtc },
      select: { mndExerciseId: true },
    });
    return rows.map((r) => r.mndExerciseId);
  }
}
