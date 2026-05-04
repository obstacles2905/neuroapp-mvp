import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserLessonProgressStatus } from '../common/enums/user-lesson-progress-status.enum';
import { AnalyticsService } from './analytics.service';
import { AppUserRepository } from './app-user.repository';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const findAllMock = jest.fn();
  const findByIdMock = jest.fn();

  beforeEach(async () => {
    findAllMock.mockReset();
    findByIdMock.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AppUserRepository,
          useValue: {
            findAllWithProgress: findAllMock,
            findByIdWithProgressAndLessons: findByIdMock,
          },
        },
      ],
    }).compile();
    service = module.get(AnalyticsService);
  });

  it('listUsers maps progress counts', async () => {
    expect.assertions(3);
    const userId = '00000000-0000-4000-8000-000000000030';
    findAllMock.mockResolvedValue([
      {
        id: userId,
        email: 'a@b.c',
        displayName: 'Test',
        progress: [
          { status: UserLessonProgressStatus.COMPLETED, lastActiveAt: null },
          { status: UserLessonProgressStatus.IN_PROGRESS, lastActiveAt: null },
        ],
      },
    ]);
    const rows = await service.listUsers();
    expect(rows).toHaveLength(1);
    expect(rows[0].lessonsCompleted).toBe(1);
    expect(rows[0].lessonsInProgress).toBe(1);
  });

  it('getUserDetail throws when missing', async () => {
    expect.assertions(1);
    const userId = '00000000-0000-4000-8000-000000000031';
    findByIdMock.mockResolvedValue(null);
    await expect(service.getUserDetail(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
