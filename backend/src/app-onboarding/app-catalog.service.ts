import { Injectable } from '@nestjs/common';
import { UserLessonProgressStatus } from '../common/enums/user-lesson-progress-status.enum';
import { CategoryRepository } from '../content-builder/category/category.repository';
import { LessonRepository } from '../content-builder/lesson/lesson.repository';
import { AppLessonProgressRepository } from './app-lesson-progress.repository';
import { AppCategoryListItemResponseDto } from './dto/app-category-list-item-response.dto';

@Injectable()
export class AppCatalogService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly appLessonProgressRepository: AppLessonProgressRepository,
  ) {}

  async listPublishedCategoriesForUser(
    appUserId: string,
  ): Promise<AppCategoryListItemResponseDto[]> {
    const rows = await this.categoryRepository.findPublishedProductionOrdered();
    if (rows.length === 0) {
      return [];
    }
    const categoryIds = rows.map((c) => c.id);
    const lessons =
      await this.lessonRepository.findPublishedByCategoryIds(categoryIds);
    const lessonsByCategory = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const list = lessonsByCategory.get(lesson.categoryId) ?? [];
      list.push(lesson);
      lessonsByCategory.set(lesson.categoryId, list);
    }
    const lessonIds = lessons.map((l) => l.id);
    const progressRows =
      await this.appLessonProgressRepository.findByAppUserIdAndLessonIds(
        appUserId,
        lessonIds,
      );
    const completedLessonIds = new Set(
      progressRows
        .filter((p) => p.status === UserLessonProgressStatus.COMPLETED)
        .map((p) => p.lessonId),
    );
    return rows.map((c) => {
      const catLessons = lessonsByCategory.get(c.id) ?? [];
      const total = catLessons.length;
      const completed = catLessons.filter((l) =>
        completedLessonIds.has(l.id),
      ).length;
      const percentComplete =
        total === 0 ? 0 : Math.round((100 * completed) / total);
      return {
        id: c.id,
        title: c.title,
        order: c.order,
        publishedLessonsCount: total,
        percentComplete,
      };
    });
  }
}
