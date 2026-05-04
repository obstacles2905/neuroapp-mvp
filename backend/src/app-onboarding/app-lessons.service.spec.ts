import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Category } from '../common/entity/category.entity';
import { Lesson } from '../common/entity/lesson.entity';
import { UserLessonProgress } from '../common/entity/user-lesson-progress.entity';
import { LessonStatus } from '../common/enums/lesson-status.enum';
import { UserLessonProgressStatus } from '../common/enums/user-lesson-progress-status.enum';
import { CategoryRepository } from '../content-builder/category/category.repository';
import { LessonRepository } from '../content-builder/lesson/lesson.repository';
import { S3Service } from '../media/s3.service';
import { ActivityStreakService } from '../activity-streak/activity-streak.service';
import { AppLessonProgressRepository } from './app-lesson-progress.repository';
import { AppLessonsService } from './app-lessons.service';

describe('AppLessonsService', () => {
  const appUserId = 'a0000000-0000-4000-8000-000000000001';
  const categoryId = 'c0000000-0000-4000-8000-000000000001';
  const lessonId = 'l0000000-0000-4000-8000-000000000001';

  const mockCategoryRepo = {
    findPublishedProductionById: jest.fn(),
  };
  const mockLessonRepo = {
    findPublishedByCategoryId: jest.fn(),
    findById: jest.fn(),
  };
  const mockProgressRepo = {
    findByAppUserIdAndLessonIds: jest.fn(),
    findByUserAndLesson: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockS3 = {
    getFileUrl: jest.fn((k: string) => `https://ex/${k}`),
  };
  const mockStreak = {
    onQualifyingActivityDay: jest.fn().mockResolvedValue(undefined),
  };

  let service: AppLessonsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLessonsService,
        { provide: CategoryRepository, useValue: mockCategoryRepo },
        { provide: LessonRepository, useValue: mockLessonRepo },
        { provide: AppLessonProgressRepository, useValue: mockProgressRepo },
        { provide: S3Service, useValue: mockS3 },
        { provide: ActivityStreakService, useValue: mockStreak },
      ],
    }).compile();
    service = module.get<AppLessonsService>(AppLessonsService);
  });

  it('listByCategory throws when category is not in catalog', async () => {
    expect.assertions(1);
    mockCategoryRepo.findPublishedProductionById.mockResolvedValue(null);
    await expect(
      service.listByCategory(appUserId, categoryId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('listByCategory returns lessons with progress', async () => {
    expect.assertions(2);
    mockCategoryRepo.findPublishedProductionById.mockResolvedValue({
      id: categoryId,
    });
    mockLessonRepo.findPublishedByCategoryId.mockResolvedValue([
      {
        id: lessonId,
        order: 0,
        title: { ru: 'R', en: 'E', uk: 'U' },
        status: LessonStatus.PUBLISHED,
      } as Lesson,
    ]);
    const progress = {
      lessonId,
      status: UserLessonProgressStatus.IN_PROGRESS,
      percentComplete: 20,
      lastViewedStepId: null,
      lastActiveAt: new Date(0),
      lessonCompletedAt: null,
    } as UserLessonProgress;
    mockProgressRepo.findByAppUserIdAndLessonIds.mockResolvedValue([progress]);
    const rows = await service.listByCategory(appUserId, categoryId);
    expect(rows).toHaveLength(1);
    expect(rows[0].progress?.percentComplete).toBe(20);
  });
});
