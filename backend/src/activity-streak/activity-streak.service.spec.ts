import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserRepository } from '../analytics/app-user.repository';
import { AppUserMndExerciseCompletion } from '../common/entity/app-user-mnd-exercise-completion.entity';
import { ActivityStreakService } from './activity-streak.service';

describe('ActivityStreakService', () => {
  const userId = 'a0000000-0000-4000-8000-000000000001';

  const mockRepo = {
    findById: jest.fn(),
    save: jest.fn().mockImplementation((u: unknown) => Promise.resolve(u)),
  };

  const mockMndCompletionRepo = {
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
          provide: getRepositoryToken(AppUserMndExerciseCompletion),
          useValue: mockMndCompletionRepo,
        },
      ],
    }).compile();
    service = module.get<ActivityStreakService>(ActivityStreakService);
  });

  it('first qualifying completion sets count to 1', async () => {
    expect.assertions(2);
    mockRepo.findById.mockResolvedValue({
      id: userId,
      activityStreakCount: 0,
      activityStreakLastCompletedAt: null,
    });
    const now = new Date('2026-06-01T10:00:00.000Z');
    await service.onQualifyingActivityCompletion(userId, now);
    const saved = mockRepo.save.mock.calls[0][0] as {
      activityStreakCount: number;
      activityStreakLastCompletedAt: Date;
    };
    expect(saved.activityStreakCount).toBe(1);
    expect(saved.activityStreakLastCompletedAt).toEqual(now);
  });

  it('second completion within 24h increments', async () => {
    expect.assertions(1);
    const prev = new Date('2026-06-01T10:00:00.000Z');
    mockRepo.findById.mockResolvedValue({
      id: userId,
      activityStreakCount: 1,
      activityStreakLastCompletedAt: prev,
    });
    await service.onQualifyingActivityCompletion(
      userId,
      new Date('2026-06-02T09:00:00.000Z'),
    );
    const saved = mockRepo.save.mock.calls[0][0] as {
      activityStreakCount: number;
    };
    expect(saved.activityStreakCount).toBe(2);
  });

  it('completion after 24h gap restarts at 1', async () => {
    expect.assertions(1);
    mockRepo.findById.mockResolvedValue({
      id: userId,
      activityStreakCount: 2,
      activityStreakLastCompletedAt: new Date('2026-06-01T10:00:00.000Z'),
    });
    await service.onQualifyingActivityCompletion(
      userId,
      new Date('2026-06-03T10:01:00.000Z'),
    );
    const saved = mockRepo.save.mock.calls[0][0] as {
      activityStreakCount: number;
    };
    expect(saved.activityStreakCount).toBe(1);
  });

  it('persistExpiredStreakIfNeeded zeroes stale count', async () => {
    expect.assertions(1);
    mockRepo.findById.mockResolvedValue({
      id: userId,
      activityStreakCount: 3,
      activityStreakLastCompletedAt: new Date('2026-06-01T10:00:00.000Z'),
    });
    await service.persistExpiredStreakIfNeeded(
      userId,
      new Date('2026-06-03T11:00:00.000Z'),
    );
    const saved = mockRepo.save.mock.calls[0][0] as {
      activityStreakCount: number;
    };
    expect(saved.activityStreakCount).toBe(0);
  });

  it('calendar returns mnd completion days', async () => {
    expect.assertions(3);
    const y = 2026;
    const m = 4;
    mockMndCompletionRepo.query.mockResolvedValue([
      { day: '2026-04-15' },
      { day: '2026-04-16' },
    ]);
    const res = await service.getActivityCalendar(userId, y, m);
    expect(res.activeDays).toEqual(['2026-04-15', '2026-04-16']);
    expect(res.daysPracticedInMonth).toBe(2);
    expect(mockMndCompletionRepo.query).toHaveBeenCalled();
  });
});
