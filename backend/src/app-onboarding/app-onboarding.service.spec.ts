import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserRepository } from '../analytics/app-user.repository';
import { MndSymptom } from '../common/entity/mnd-symptom.entity';
import { MndSymptomService } from '../mnd/mnd-symptom.service';
import { AppOnboardingService } from './app-onboarding.service';

describe('AppOnboardingService', () => {
  const userId = 'u0000000-0000-4000-8000-000000000001';
  const symptomA = 'c0000000-0000-4000-8000-000000000001';
  const symptomB = 'c0000000-0000-4000-8000-000000000002';

  const mockMndSymptomService = {
    findPublishedForOnboarding: jest.fn(),
  };
  const mockAppUserRepo = {
    findById: jest.fn(),
    save: jest.fn(),
  };

  let service: AppOnboardingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppOnboardingService,
        { provide: MndSymptomService, useValue: mockMndSymptomService },
        { provide: AppUserRepository, useValue: mockAppUserRepo },
      ],
    }).compile();
    service = module.get<AppOnboardingService>(AppOnboardingService);
  });

  it('submit saves ordered symptom ranks 1..n', async () => {
    expect.assertions(2);
    mockMndSymptomService.findPublishedForOnboarding.mockResolvedValue([
      { id: symptomA } as MndSymptom,
      { id: symptomB } as MndSymptom,
    ]);
    mockAppUserRepo.findById.mockResolvedValue({ id: userId, email: 'a@a.com' });
    mockAppUserRepo.save.mockImplementation((u: unknown) => Promise.resolve(u));
    await service.submit(userId, { orderedSymptomIds: [symptomB, symptomA] });
    const saved = mockAppUserRepo.save.mock.calls[0][0] as {
      onboardingSymptomRanks: {
        symptomId: string;
        rank: number;
        isActive: boolean;
      }[];
      onboardingCategoryRanks: null;
    };
    expect(saved.onboardingSymptomRanks).toEqual([
      { symptomId: symptomB, rank: 1, isActive: true },
      { symptomId: symptomA, rank: 2, isActive: true },
    ]);
    expect(saved.onboardingCategoryRanks).toBeNull();
  });

  it('submit throws on unknown symptom', async () => {
    expect.assertions(1);
    mockMndSymptomService.findPublishedForOnboarding.mockResolvedValue([]);
    await expect(
      service.submit(userId, { orderedSymptomIds: [symptomA] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('clearForReplay clears symptom ranks', async () => {
    expect.assertions(1);
    const user = { id: userId, email: 'a@a.com' };
    mockAppUserRepo.findById.mockResolvedValue(user);
    mockAppUserRepo.save.mockImplementation((u: unknown) => Promise.resolve(u));
    await service.clearForReplay(userId);
    const saved = mockAppUserRepo.save.mock.calls[0][0] as {
      onboardingSymptomRanks: null;
    };
    expect(saved.onboardingSymptomRanks).toBeNull();
  });

  it('clearForReplay throws when user missing', async () => {
    expect.assertions(1);
    mockAppUserRepo.findById.mockResolvedValue(null);
    await expect(service.clearForReplay(userId)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('skip sets onboardingSkippedAt', async () => {
    expect.assertions(2);
    const user = { id: userId, email: 'a@a.com' };
    mockAppUserRepo.findById.mockResolvedValue(user);
    mockAppUserRepo.save.mockImplementation((u: unknown) => Promise.resolve(u));
    await service.skip(userId);
    const saved = mockAppUserRepo.save.mock.calls[0][0] as {
      onboardingSkippedAt: Date;
    };
    expect(saved.onboardingSkippedAt).toBeInstanceOf(Date);
    expect(mockAppUserRepo.save).toHaveBeenCalled();
  });
});
