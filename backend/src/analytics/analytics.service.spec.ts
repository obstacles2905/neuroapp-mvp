import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { AppUserMndExerciseCompletionRepository } from './app-user-mnd-exercise-completion.repository';
import { AppUserRepository } from './app-user.repository';
import { UsageTrackingRepository } from '../usage-tracking/usage-tracking.repository';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  const findAllOrderedMock = jest.fn();
  const findByIdMock = jest.fn();
  const countByAppUserIdMock = jest.fn();
  const findTotalsForUsersMock = jest.fn();
  const sumSessionsMock = jest.fn();

  beforeEach(async () => {
    findAllOrderedMock.mockReset();
    findByIdMock.mockReset();
    countByAppUserIdMock.mockReset();
    findTotalsForUsersMock.mockReset();
    sumSessionsMock.mockReset();
    findTotalsForUsersMock.mockResolvedValue([]);
    sumSessionsMock.mockResolvedValue(0);
    countByAppUserIdMock.mockResolvedValue(3);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AppUserRepository,
          useValue: {
            findAllOrdered: findAllOrderedMock,
            findById: findByIdMock,
          },
        },
        {
          provide: AppUserMndExerciseCompletionRepository,
          useValue: {
            countByAppUserId: countByAppUserIdMock,
          },
        },
        {
          provide: UsageTrackingRepository,
          useValue: {
            findTotalsForUsers: findTotalsForUsersMock,
            sumSessionsSinceLocalDay: sumSessionsMock,
            findTotalsForUser: jest.fn().mockResolvedValue({
              totalAppMs: '0',
              totalExerciseMs: '0',
            }),
            findDailyInRange: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();
    service = module.get(AnalyticsService);
  });

  it('listUsers maps mnd completion counts', async () => {
    expect.assertions(2);
    const userId = '00000000-0000-4000-8000-000000000030';
    findAllOrderedMock.mockResolvedValue([
      {
        id: userId,
        email: 'a@b.c',
        displayName: 'Test',
        usageTimezone: null,
        lastSeenAt: null,
        activityStreakLastCompletedAt: null,
      },
    ]);
    const rows = await service.listUsers();
    expect(rows).toHaveLength(1);
    expect(rows[0].mndExercisesCompleted).toBe(3);
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
