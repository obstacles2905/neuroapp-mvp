import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  MND_MASTER_STACK_SEED_ROWS,
  MND_MATRIX_RULE_SEED_ROWS,
  MND_SYMPTOM_SEED_ROWS,
} from '../common/constants/mnd-seed.constant';
import { MND_SEED_ENV_KEYS } from '../common/constants/mnd-seed-env-keys.constant';
import { MndMasterStack } from '../common/entity/mnd-master-stack.entity';
import { MndMatrixRule } from '../common/entity/mnd-matrix-rule.entity';
import { MndSeedService } from './mnd-seed.service';
import { MndExerciseRepository } from './repositories/mnd-exercise.repository';
import { MndMasterStackRepository } from './repositories/mnd-master-stack.repository';
import { MndMatrixRuleRepository } from './repositories/mnd-matrix-rule.repository';
import { MndSymptomRepository } from './repositories/mnd-symptom.repository';

describe('MndSeedService', () => {
  let service: MndSeedService;
  const configGetMock = jest.fn();
  const stackFindByIdMock = jest.fn();
  const stackCreateMock = jest.fn();
  const stackSaveMock = jest.fn();
  const symptomFindByIdMock = jest.fn();
  const symptomCreateMock = jest.fn();
  const symptomSaveMock = jest.fn();
  const ruleFindByIdWithRelationsMock = jest.fn();
  const ruleCreateMock = jest.fn();
  const ruleCreateStackMock = jest.fn();
  const ruleSaveWithStacksMock = jest.fn();
  const exerciseFindByIdMock = jest.fn();
  const exerciseCreateMock = jest.fn();
  const exerciseSaveMock = jest.fn();

  beforeEach(async () => {
    configGetMock.mockReset();
    stackFindByIdMock.mockReset();
    stackCreateMock.mockReset();
    stackSaveMock.mockReset();
    symptomFindByIdMock.mockReset();
    symptomCreateMock.mockReset();
    symptomSaveMock.mockReset();
    ruleFindByIdWithRelationsMock.mockReset();
    ruleCreateMock.mockReset();
    ruleCreateStackMock.mockReset();
    ruleSaveWithStacksMock.mockReset();
    exerciseFindByIdMock.mockReset();
    exerciseCreateMock.mockReset();
    exerciseSaveMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MndSeedService,
        { provide: ConfigService, useValue: { get: configGetMock } },
        {
          provide: MndMasterStackRepository,
          useValue: {
            findById: stackFindByIdMock,
            create: stackCreateMock,
            save: stackSaveMock,
          },
        },
        {
          provide: MndSymptomRepository,
          useValue: {
            findById: symptomFindByIdMock,
            create: symptomCreateMock,
            save: symptomSaveMock,
          },
        },
        {
          provide: MndMatrixRuleRepository,
          useValue: {
            findByIdWithRelations: ruleFindByIdWithRelationsMock,
            create: ruleCreateMock,
            createStack: ruleCreateStackMock,
            saveWithStacks: ruleSaveWithStacksMock,
          },
        },
        {
          provide: MndExerciseRepository,
          useValue: {
            findById: exerciseFindByIdMock,
            create: exerciseCreateMock,
            save: exerciseSaveMock,
          },
        },
      ],
    }).compile();

    service = module.get(MndSeedService);
  });

  it('skips seeding when env flag is disabled', async () => {
    expect.assertions(2);
    const disabledValue = 'false';
    configGetMock.mockReturnValue(disabledValue);

    await service.onModuleInit();

    expect(configGetMock).toHaveBeenCalledWith(MND_SEED_ENV_KEYS.ENABLED);
    expect(stackFindByIdMock).not.toHaveBeenCalled();
  });

  it('creates missing seed rows', async () => {
    expect.assertions(6);
    const firstStack = MND_MASTER_STACK_SEED_ROWS[0];
    const firstSymptom = MND_SYMPTOM_SEED_ROWS[0];
    const firstRule = MND_MATRIX_RULE_SEED_ROWS[0];
    const stackEntity = { id: firstStack.id, code: firstStack.code };
    const ruleEntity = { id: firstRule.id } as MndMatrixRule;
    const ruleStackEntity = { masterStackId: firstStack.id };
    stackFindByIdMock.mockResolvedValue(null);
    stackCreateMock.mockImplementation((data: Partial<MndMasterStack>) => data);
    stackSaveMock.mockImplementation((data: MndMasterStack) =>
      Promise.resolve(data),
    );
    symptomFindByIdMock.mockResolvedValue(null);
    symptomCreateMock.mockImplementation((data: object) => data);
    symptomSaveMock.mockImplementation((data: object) => Promise.resolve(data));
    ruleFindByIdWithRelationsMock.mockResolvedValue(null);
    ruleCreateMock.mockReturnValue(ruleEntity);
    ruleCreateStackMock.mockReturnValue(ruleStackEntity);
    ruleSaveWithStacksMock.mockResolvedValue(ruleEntity);
    exerciseFindByIdMock.mockResolvedValue(null);
    exerciseCreateMock.mockImplementation((data: object) => data);
    exerciseSaveMock.mockImplementation((data: object) =>
      Promise.resolve(data),
    );

    await service.seedIfNeeded();

    expect(stackCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: firstStack.id, code: firstStack.code }),
    );
    expect(symptomCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: firstSymptom.id, code: firstSymptom.code }),
    );
    expect(ruleCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: firstRule.id,
        symptomId: firstRule.symptomId,
      }),
    );
    expect(ruleCreateStackMock).toHaveBeenCalled();
    expect(ruleSaveWithStacksMock).toHaveBeenCalled();
    expect(stackEntity).toEqual({
      id: firstStack.id,
      code: firstStack.code,
    });
  });
});
