import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { AppUserVoiceMeasurementSession } from '../common/entity/app-user-voice-measurement-session.entity';
import type { SubmitVoiceMeasurementDto } from './dto/submit-voice-measurement.dto';
import { VoiceMeasurementService } from './voice-measurement.service';

describe('VoiceMeasurementService', () => {
  const appUserId = 'b0000000-0000-4000-8000-000000000002';
  const sessionUuid = 'c0000000-0000-4000-8000-000000000003';

  const mockRepo = {
    create: jest.fn((partial: Partial<AppUserVoiceMeasurementSession>) => ({
      ...partial,
    })),
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((row: AppUserVoiceMeasurementSession) =>
      Promise.resolve(row),
    ),
  };

  let service: VoiceMeasurementService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceMeasurementService,
        {
          provide: getRepositoryToken(AppUserVoiceMeasurementSession),
          useValue: mockRepo,
        },
      ],
    }).compile();
    service = module.get<VoiceMeasurementService>(VoiceMeasurementService);
  });

  function buildDto(throat: number): SubmitVoiceMeasurementDto {
    return {
      capturedAt: '2026-05-13T12:00:00.000Z',
      durationMs: 9000,
      extractorId: 'opensmile',
      extractorVersion: 'stub-test',
      featureSet: 'custom',
      id: sessionUuid,
      interpretation: {
        bullets: ['test'],
        disclaimerLine: 'd',
        headline: 'h',
      },
      metrics: {
        confidenceScore: 80,
        emotionalActivationScore: 40,
        monotonicityScore: 30,
        throatTensionScore: throat,
        tremorScore: 25,
        vocalStabilityScore: 70,
      },
      protocolVersion: 'voice-mvp-v1',
      quality: {
        overall: 'ok',
      },
      scoringVersion: 'mvp-rules-v1',
    };
  }

  it('creates new aggregate when session id is unknown', async () => {
    expect.assertions(3);
    mockRepo.findOne.mockResolvedValue(null);
    const dto = buildDto(41);

    await service.upsertAggregate(appUserId, dto);

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { appUserId, sessionId: sessionUuid },
    });
    expect(mockRepo.create).toHaveBeenCalledWith({
      appUserId,
      sessionId: sessionUuid,
    });
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('updates existing row for same user and session id (idempotent replay)', async () => {
    expect.assertions(2);
    const existing = {
      appUserId,
      durationMs: 100,
      id: 'existing-row-id',
      metrics: { throatTensionScore: 10 },
      sessionId: sessionUuid,
    } as unknown as AppUserVoiceMeasurementSession;
    mockRepo.findOne.mockResolvedValue(existing);
    const dto = buildDto(55);

    await service.upsertAggregate(appUserId, dto);

    expect(mockRepo.create).not.toHaveBeenCalled();
    const saved = mockRepo.save.mock.calls[0][0] as AppUserVoiceMeasurementSession;
    expect(saved.metrics.throatTensionScore).toBe(55);
  });
});
