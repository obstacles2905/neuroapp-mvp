import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserRepository } from '../analytics/app-user.repository';
import { UserLessonProgress } from '../common/entity/user-lesson-progress.entity';
import { ActivityStreakService } from './activity-streak.service';

describe('ActivityStreakService', () => {
  const userId = 'a0000000-0000-4000-8000-000000000001';

  const mockRepo = {
    findById: jest.fn(),
    save: jest.fn().mockImplementation((u: unknown) => Promise.resolve(u)),
  };

  const mockProgressRepo = {
    query: jest.fn().mockResolvedValue([]),
  };

  let service: ActivityStreakService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityStreakService,
        { provide: AppUserRepository, useValue: mockRepo },
        {
          provide: getRepositoryToken(UserLessonProgress),
          useValue: mockProgressRepo,
        },
      ],
    }).compile();
    service = module.get<ActivityStreakService>(ActivityStreakService);
  });

  it('first qualifying day sets count to 1', async () => {
    expect.assertions(2);
    mockRepo.findById.mockResolvedValue({
      id: userId,
      activityStreakCount: 0,
      activityStreakLastUtcDate: null,
    });
    const d = new Date('2026-04-23T15:00:00.000Z');
    await service.onQualifyingActivityDay(userId, d);
    const saved = mockRepo.save.mock.calls[0][0] as {
      activityStreakCount: number;
      activityStreakLastUtcDate: string;
    };
    expect(saved.activityStreakCount).toBe(1);
    expect(saved.activityStreakLastUtcDate).toBe('2026-04-23');
  });

  it('second activity same UTC day does not increment', async () => {
    expect.assertions(1);
    mockRepo.findById.mockResolvedValue({
      id: userId,
      activityStreakCount: 1,
      activityStreakLastUtcDate: '2026-04-23',
    });
    await service.onQualifyingActivityDay(
      userId,
      new Date('2026-04-23T22:00:00.000Z'),
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('next consecutive day increments', async () => {
    expect.assertions(1);
    mockRepo.findById.mockResolvedValue({
      id: userId,
      activityStreakCount: 2,
      activityStreakLastUtcDate: '2026-04-22',
    });
    await service.onQualifyingActivityDay(
      userId,
      new Date('2026-04-23T12:00:00.000Z'),
    );
    const saved = mockRepo.save.mock.calls[0][0] as {
      activityStreakCount: number;
    };
    expect(saved.activityStreakCount).toBe(3);
  });

  it('calendar merges lesson and mnd completion days', async () => {
    expect.assertions(3);
    const y = 2026;
    const m = 4;
    mockProgressRepo.query.mockResolvedValue([
      { day: '2026-04-15' },
      { day: '2026-04-16' },
    ]);
    const res = await service.getActivityCalendar(userId, y, m);
    expect(res.activeDays).toEqual(['2026-04-15', '2026-04-16']);
    expect(res.daysPracticedInMonth).toBe(2);
    expect(mockProgressRepo.query).toHaveBeenCalled();
  });
});
