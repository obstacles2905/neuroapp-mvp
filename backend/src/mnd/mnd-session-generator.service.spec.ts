import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserMndExerciseCompletionRepository } from '../analytics/app-user-mnd-exercise-completion.repository';
import { AppUserMndJamExerciseDayCompletionRepository } from '../analytics/app-user-mnd-jam-exercise-day-completion.repository';
import { AppUserRepository } from '../analytics/app-user.repository';
import { MndExerciseDirection } from '../common/enums/mnd-exercise-direction.enum';
import type { MndExercise } from '../common/entity/mnd-exercise.entity';
import type { MndMatrixRule } from '../common/entity/mnd-matrix-rule.entity';
import { MndMasterStackCode } from '../common/enums/mnd-master-stack-code.enum';
import {
  MND_JAM_SESSION_STEP_COUNT,
  MND_SOS_SESSION_STEP_COUNT,
} from '../common/constants/mnd-session-generator.constant';
import { MndSessionGeneratorService } from './mnd-session-generator.service';
import { MndExerciseRepository } from './repositories/mnd-exercise.repository';
import { MndMatrixRuleRepository } from './repositories/mnd-matrix-rule.repository';

describe('MndSessionGeneratorService', () => {
  const userId = 'a0000000-0000-4000-8000-000000000001';
  const symptomId = '20000000-0000-4000-8000-000000000001';
  const stackId = '10000000-0000-4000-8000-000000000004';

  const mockUserRepo = { findById: jest.fn() };
  const mockCompletionRepo = { findMndExerciseIdsCompletedByUser: jest.fn() };
  const mockJamDayRepo = { findMndExerciseIdsCompletedOnDay: jest.fn() };
  const mockRuleRepo = { findBySymptomIdsWithStacks: jest.fn() };
  const mockExRepo = { findPublishedByMasterStackIds: jest.fn() };

  let service: MndSessionGeneratorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockCompletionRepo.findMndExerciseIdsCompletedByUser.mockResolvedValue([]);
    mockJamDayRepo.findMndExerciseIdsCompletedOnDay.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MndSessionGeneratorService,
        { provide: AppUserRepository, useValue: mockUserRepo },
        {
          provide: AppUserMndExerciseCompletionRepository,
          useValue: mockCompletionRepo,
        },
        {
          provide: AppUserMndJamExerciseDayCompletionRepository,
          useValue: mockJamDayRepo,
        },
        { provide: MndMatrixRuleRepository, useValue: mockRuleRepo },
        { provide: MndExerciseRepository, useValue: mockExRepo },
      ],
    }).compile();
    service = module.get(MndSessionGeneratorService);
  });

  it('throws when user missing', async () => {
    expect.assertions(1);
    mockUserRepo.findById.mockResolvedValue(null);
    await expect(service.buildDailySessionForUser(userId)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws when no symptoms onboarded', async () => {
    expect.assertions(1);
    mockUserRepo.findById.mockResolvedValue({
      id: userId,
      onboardingSymptomRanks: null,
    });
    await expect(service.buildDailySessionForUser(userId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns steps with expected length', async () => {
    expect.assertions(2);
    mockUserRepo.findById.mockResolvedValue({
      id: userId,
      onboardingSymptomRanks: [
        { symptomId, rank: 1, isActive: true },
      ],
    });
    const rule = {
      symptomId,
      bottomUpPercent: 50,
      topDownPercent: 50,
      stacks: [{ masterStackId: stackId, priority: 0 }],
    } as MndMatrixRule;
    mockRuleRepo.findBySymptomIdsWithStacks.mockResolvedValue([rule]);
    const mkEx = (dir: MndExerciseDirection, n: number): MndExercise =>
      ({
        id: `40000000-0000-4000-8000-000000000${String(n).padStart(3, '0')}`,
        title: { ru: `t${String(n)}`, uk: '', en: '' },
        direction: dir,
        complexityLevel: 5,
        masterStack: { code: MndMasterStackCode.ST_4 },
      }) as MndExercise;
    const pool: MndExercise[] = [];
    for (let i = 0; i < 8; i++) {
      pool.push(
        mkEx(
          i % 2 === 0 ? MndExerciseDirection.BOTTOM_UP : MndExerciseDirection.TOP_DOWN,
          200 + i,
        ),
      );
    }
    mockExRepo.findPublishedByMasterStackIds.mockResolvedValue(pool);
    const res = await service.buildDailySessionForUser(userId);
    expect(res.steps).toHaveLength(6);
    expect(res.symptomIdsUsed).toEqual([symptomId]);
  });

  it('SOS throws when symptom has no matrix rule', async () => {
    expect.assertions(1);
    const orphanSymptomId = '20000000-0000-4000-8000-000099999999';
    mockUserRepo.findById.mockResolvedValue({ id: userId });
    mockRuleRepo.findBySymptomIdsWithStacks.mockResolvedValue([]);
    await expect(
      service.buildSosSessionForUser(userId, orphanSymptomId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('SOS returns short session for one symptom', async () => {
    expect.assertions(2);
    mockUserRepo.findById.mockResolvedValue({ id: userId });
    const rule = {
      symptomId,
      bottomUpPercent: 50,
      topDownPercent: 50,
      stacks: [{ masterStackId: stackId, priority: 0 }],
    } as MndMatrixRule;
    mockRuleRepo.findBySymptomIdsWithStacks.mockResolvedValue([rule]);
    const mkEx = (dir: MndExerciseDirection, n: number): MndExercise =>
      ({
        id: `50000000-0000-4000-8000-000000000${String(n).padStart(3, '0')}`,
        title: { ru: `s${String(n)}`, uk: '', en: '' },
        direction: dir,
        complexityLevel: 5,
        masterStack: { code: MndMasterStackCode.ST_4 },
      }) as MndExercise;
    const pool: MndExercise[] = [];
    for (let i = 0; i < 8; i++) {
      pool.push(
        mkEx(
          i % 2 === 0 ? MndExerciseDirection.BOTTOM_UP : MndExerciseDirection.TOP_DOWN,
          300 + i,
        ),
      );
    }
    mockExRepo.findPublishedByMasterStackIds.mockResolvedValue(pool);
    const res = await service.buildSosSessionForUser(userId, symptomId);
    expect(res.steps).toHaveLength(MND_SOS_SESSION_STEP_COUNT);
    expect(res.symptomIdsUsed).toEqual([symptomId]);
  });

  it('jam throws when user has no completed exercises in eligible stacks', async () => {
    expect.assertions(1);
    mockUserRepo.findById.mockResolvedValue({
      id: userId,
      onboardingSymptomRanks: [{ symptomId, rank: 1, isActive: true }],
    });
    const rule = {
      symptomId,
      bottomUpPercent: 50,
      topDownPercent: 50,
      stacks: [{ masterStackId: stackId, priority: 0 }],
    } as MndMatrixRule;
    mockRuleRepo.findBySymptomIdsWithStacks.mockResolvedValue([rule]);
    mockExRepo.findPublishedByMasterStackIds.mockResolvedValue([
      {
        id: '40000000-0000-4000-8000-000000000201',
        direction: MndExerciseDirection.BOTTOM_UP,
      } as MndExercise,
    ]);
    mockCompletionRepo.findMndExerciseIdsCompletedByUser.mockResolvedValue([]);
    await expect(service.buildJamSessionForUser(userId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('jam returns only from completed pool with expected length', async () => {
    expect.assertions(5);
    mockUserRepo.findById.mockResolvedValue({
      id: userId,
      onboardingSymptomRanks: [{ symptomId, rank: 1, isActive: true }],
    });
    const rule = {
      symptomId,
      bottomUpPercent: 50,
      topDownPercent: 50,
      stacks: [{ masterStackId: stackId, priority: 0 }],
    } as MndMatrixRule;
    mockRuleRepo.findBySymptomIdsWithStacks.mockResolvedValue([rule]);
    const mkEx = (dir: MndExerciseDirection, n: number): MndExercise =>
      ({
        id: `40000000-0000-4000-8000-000000000${String(n).padStart(3, '0')}`,
        title: { ru: `t${String(n)}`, uk: '', en: '' },
        direction: dir,
        complexityLevel: 5,
        masterStack: { code: MndMasterStackCode.ST_4 },
      }) as MndExercise;
    const pool: MndExercise[] = [];
    for (let i = 0; i < 8; i++) {
      pool.push(
        mkEx(
          i % 2 === 0 ? MndExerciseDirection.BOTTOM_UP : MndExerciseDirection.TOP_DOWN,
          700 + i,
        ),
      );
    }
    mockExRepo.findPublishedByMasterStackIds.mockResolvedValue(pool);
    const allowedId = `40000000-0000-4000-8000-000000000${String(700).padStart(3, '0')}`;
    mockCompletionRepo.findMndExerciseIdsCompletedByUser.mockResolvedValue([
      allowedId,
    ]);
    const res = await service.buildJamSessionForUser(userId);
    expect(res.steps).toHaveLength(MND_JAM_SESSION_STEP_COUNT);
    expect(res.steps.every((s) => s.id === allowedId)).toBe(true);
    expect(res.steps.every((s) => s.completed === false)).toBe(true);
    expect(mockJamDayRepo.findMndExerciseIdsCompletedOnDay).toHaveBeenCalled();
    expect(res.symptomIdsUsed).toEqual([symptomId]);
  });

  it('jam marks step completed when recorded for jam day', async () => {
    expect.assertions(2);
    mockUserRepo.findById.mockResolvedValue({
      id: userId,
      onboardingSymptomRanks: [{ symptomId, rank: 1, isActive: true }],
    });
    const rule = {
      symptomId,
      bottomUpPercent: 50,
      topDownPercent: 50,
      stacks: [{ masterStackId: stackId, priority: 0 }],
    } as MndMatrixRule;
    mockRuleRepo.findBySymptomIdsWithStacks.mockResolvedValue([rule]);
    const mkEx = (dir: MndExerciseDirection, n: number): MndExercise =>
      ({
        id: `40000000-0000-4000-8000-000000000${String(n).padStart(3, '0')}`,
        title: { ru: `t${String(n)}`, uk: '', en: '' },
        direction: dir,
        complexityLevel: 5,
        masterStack: { code: MndMasterStackCode.ST_4 },
      }) as MndExercise;
    const pool: MndExercise[] = [];
    for (let i = 0; i < 8; i++) {
      pool.push(
        mkEx(
          i % 2 === 0 ? MndExerciseDirection.BOTTOM_UP : MndExerciseDirection.TOP_DOWN,
          800 + i,
        ),
      );
    }
    mockExRepo.findPublishedByMasterStackIds.mockResolvedValue(pool);
    const jamDoneId = `40000000-0000-4000-8000-000000000${String(800).padStart(3, '0')}`;
    mockCompletionRepo.findMndExerciseIdsCompletedByUser.mockResolvedValue([
      jamDoneId,
    ]);
    mockJamDayRepo.findMndExerciseIdsCompletedOnDay.mockResolvedValue([
      jamDoneId,
    ]);
    const res = await service.buildJamSessionForUser(userId);
    expect(res.steps.length).toBeGreaterThan(0);
    expect(res.steps.every((s) => (s.id === jamDoneId) === s.completed)).toBe(
      true,
    );
  });
});
