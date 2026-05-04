import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserLessonProgress } from '../common/entity/user-lesson-progress.entity';

@Injectable()
export class AppLessonProgressRepository {
  constructor(
    @InjectRepository(UserLessonProgress)
    private readonly repository: Repository<UserLessonProgress>,
  ) {}

  findByAppUserIdAndLessonIds(
    appUserId: string,
    lessonIds: string[],
  ): Promise<UserLessonProgress[]> {
    if (lessonIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.repository.find({
      where: { appUserId, lessonId: In(lessonIds) },
    });
  }

  findByUserAndLesson(
    appUserId: string,
    lessonId: string,
  ): Promise<UserLessonProgress | null> {
    return this.repository.findOne({ where: { appUserId, lessonId } });
  }

  create(partial: Partial<UserLessonProgress>): UserLessonProgress {
    return this.repository.create(partial);
  }

  save(entity: UserLessonProgress): Promise<UserLessonProgress> {
    return this.repository.save(entity);
  }
}
