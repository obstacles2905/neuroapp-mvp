import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MndMasterStack } from '../common/entity/mnd-master-stack.entity';
import { MndMasterStackCode } from '../common/enums/mnd-master-stack-code.enum';
import { CreateMndMasterStackDto } from './dto/create-mnd-master-stack.dto';
import { MndMasterStackService } from './mnd-master-stack.service';
import { MndMasterStackRepository } from './repositories/mnd-master-stack.repository';

describe('MndMasterStackService', () => {
  let service: MndMasterStackService;
  const findAllOrderedMock = jest.fn();
  const findByIdMock = jest.fn();
  const createMock = jest.fn();
  const saveMock = jest.fn();
  const removeMock = jest.fn();

  beforeEach(async () => {
    findAllOrderedMock.mockReset();
    findByIdMock.mockReset();
    createMock.mockReset();
    saveMock.mockReset();
    removeMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MndMasterStackService,
        {
          provide: MndMasterStackRepository,
          useValue: {
            findAllOrdered: findAllOrderedMock,
            findById: findByIdMock,
            create: createMock,
            save: saveMock,
            remove: removeMock,
          },
        },
      ],
    }).compile();

    service = module.get(MndMasterStackService);
  });

  it('create persists active stack defaults', async () => {
    expect.assertions(2);
    const text = { ru: 'Вагус', uk: 'Вагус', en: 'Vagus' };
    const dto: CreateMndMasterStackDto = {
      code: MndMasterStackCode.ST_1,
      title: text,
      description: text,
    };
    const created = { id: 'stack-id' } as MndMasterStack;
    createMock.mockReturnValue(created);
    saveMock.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(createMock).toHaveBeenCalledWith({
      code: MndMasterStackCode.ST_1,
      title: text,
      description: text,
      order: 0,
      isActive: true,
    });
    expect(result).toBe(created);
  });

  it('findOne throws when stack is missing', async () => {
    expect.assertions(1);
    const stackId = '00000000-0000-4000-8000-000000000201';
    findByIdMock.mockResolvedValue(null);
    await expect(service.findOne(stackId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
