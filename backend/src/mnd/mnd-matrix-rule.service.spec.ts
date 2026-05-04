import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MndMatrixRule } from '../common/entity/mnd-matrix-rule.entity';
import { CreateMndMatrixRuleDto } from './dto/create-mnd-matrix-rule.dto';
import { MndMatrixRuleService } from './mnd-matrix-rule.service';
import { MndMasterStackRepository } from './repositories/mnd-master-stack.repository';
import { MndMatrixRuleRepository } from './repositories/mnd-matrix-rule.repository';
import { MndSymptomRepository } from './repositories/mnd-symptom.repository';

describe('MndMatrixRuleService', () => {
  let service: MndMatrixRuleService;
  const findAllWithRelationsMock = jest.fn();
  const findByIdWithRelationsMock = jest.fn();
  const createMock = jest.fn();
  const createStackMock = jest.fn();
  const saveWithStacksMock = jest.fn();
  const removeMock = jest.fn();
  const symptomFindByIdMock = jest.fn();
  const stackFindByIdsMock = jest.fn();

  beforeEach(async () => {
    findAllWithRelationsMock.mockReset();
    findByIdWithRelationsMock.mockReset();
    createMock.mockReset();
    createStackMock.mockReset();
    saveWithStacksMock.mockReset();
    removeMock.mockReset();
    symptomFindByIdMock.mockReset();
    stackFindByIdsMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MndMatrixRuleService,
        {
          provide: MndMatrixRuleRepository,
          useValue: {
            findAllWithRelations: findAllWithRelationsMock,
            findByIdWithRelations: findByIdWithRelationsMock,
            create: createMock,
            createStack: createStackMock,
            saveWithStacks: saveWithStacksMock,
            remove: removeMock,
          },
        },
        {
          provide: MndSymptomRepository,
          useValue: { findById: symptomFindByIdMock },
        },
        {
          provide: MndMasterStackRepository,
          useValue: { findByIds: stackFindByIdsMock },
        },
      ],
    }).compile();

    service = module.get(MndMatrixRuleService);
  });

  it('create rejects unbalanced weights', async () => {
    expect.assertions(1);
    const dto = buildRuleDto(70, 20);
    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('create rejects duplicate stack ids', async () => {
    expect.assertions(1);
    const dto = buildRuleDto(70, 30);
    const duplicateStackId = dto.stacks[0].masterStackId;
    dto.stacks[1].masterStackId = duplicateStackId;
    symptomFindByIdMock.mockResolvedValue({ id: dto.symptomId });
    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('create rejects unknown symptom', async () => {
    expect.assertions(1);
    const dto = buildRuleDto(70, 30);
    symptomFindByIdMock.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create persists rule with ranked stacks', async () => {
    expect.assertions(3);
    const dto = buildRuleDto(70, 30);
    const rule = { id: 'rule-id' } as MndMatrixRule;
    const stack = { masterStackId: dto.stacks[0].masterStackId };
    symptomFindByIdMock.mockResolvedValue({ id: dto.symptomId });
    stackFindByIdsMock.mockResolvedValue([
      { id: dto.stacks[0].masterStackId },
      { id: dto.stacks[1].masterStackId },
    ]);
    createMock.mockReturnValue(rule);
    createStackMock.mockReturnValue(stack);
    saveWithStacksMock.mockResolvedValue(rule);

    const result = await service.create(dto);

    expect(createMock).toHaveBeenCalledWith({
      symptomId: dto.symptomId,
      targetAction: dto.targetAction,
      bottomUpPercent: dto.bottomUpPercent,
      topDownPercent: dto.topDownPercent,
    });
    expect(saveWithStacksMock).toHaveBeenCalledWith(rule, [stack, stack]);
    expect(result).toBe(rule);
  });

  function buildRuleDto(
    bottomUpPercent: number,
    topDownPercent: number,
  ): CreateMndMatrixRuleDto {
    const symptomId = '00000000-0000-4000-8000-000000000401';
    const firstStackId = '00000000-0000-4000-8000-000000000402';
    const secondStackId = '00000000-0000-4000-8000-000000000403';
    const text = { ru: 'Цель', uk: 'Ціль', en: 'Target' };
    return {
      symptomId,
      targetAction: text,
      bottomUpPercent,
      topDownPercent,
      stacks: [
        { masterStackId: firstStackId, priority: 0 },
        { masterStackId: secondStackId, priority: 1 },
      ],
    };
  }
});
