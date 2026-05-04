import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUserMndExerciseCompletion } from '../common/entity/app-user-mnd-exercise-completion.entity';

@Injectable()
export class AppUserMndExerciseCompletionRepository {
  constructor(
    @InjectRepository(AppUserMndExerciseCompletion)
    private readonly repository: Repository<AppUserMndExerciseCompletion>,
  ) {}

  async recordFirstCompletion(
    appUserId: string,
    mndExerciseId: string,
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(AppUserMndExerciseCompletion)
      .values({ appUserId, mndExerciseId })
      .orIgnore()
      .execute();
  }

  async findMndExerciseIdsCompletedByUser(
    appUserId: string,
  ): Promise<string[]> {
    const rows = await this.repository.find({
      where: { appUserId },
      select: { mndExerciseId: true },
    });
    return rows.map((r) => r.mndExerciseId);
  }
}
