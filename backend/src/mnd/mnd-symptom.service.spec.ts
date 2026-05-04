import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MndSymptom } from '../common/entity/mnd-symptom.entity';
import { CreateMndSymptomDto } from './dto/create-mnd-symptom.dto';
import { MndSymptomService } from './mnd-symptom.service';
import { MndSymptomRepository } from './repositories/mnd-symptom.repository';

describe('MndSymptomService', () => {
  let service: MndSymptomService;
  const findAllOrderedMock = jest.fn();
  const findPublishedOrderedMock = jest.fn();
  const findByIdMock = jest.fn();
  const createMock = jest.fn();
  const saveMock = jest.fn();
  const removeMock = jest.fn();

  beforeEach(async () => {
    findAllOrderedMock.mockReset();
    findPublishedOrderedMock.mockReset();
    findByIdMock.mockReset();
    createMock.mockReset();
    saveMock.mockReset();
    removeMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MndSymptomService,
        {
          provide: MndSymptomRepository,
          useValue: {
            findAllOrdered: findAllOrderedMock,
            findPublishedOrdered: findPublishedOrderedMock,
            findById: findByIdMock,
            create: createMock,
            save: saveMock,
            remove: removeMock,
          },
        },
      ],
    }).compile();

    service = module.get(MndSymptomService);
  });

  it('create persists symptom defaults', async () => {
    expect.assertions(2);
    const code = 'MND-01';
    const text = { ru: 'Жвачка', uk: 'Жвачка', en: 'Rumination' };
    const dto: CreateMndSymptomDto = {
      code,
      title: text,
      description: text,
      neurophysiologicalRoot: text,
    };
    const created = { id: code } as MndSymptom;
    createMock.mockReturnValue(created);
    saveMock.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(createMock).toHaveBeenCalledWith({
      code,
      title: text,
      description: text,
      neurophysiologicalRoot: text,
      order: 0,
      isPublished: false,
    });
    expect(result).toBe(created);
  });

  it('findPublishedForOnboarding delegates to repository', async () => {
    expect.assertions(1);
    const symptomRowId = '00000000-0000-4000-8000-0000000000a1';
    const published = [{ id: symptomRowId } as MndSymptom];
    findPublishedOrderedMock.mockResolvedValue(published);
    const result = await service.findPublishedForOnboarding();
    expect(result).toEqual([
      expect.objectContaining({ id: symptomRowId }),
    ]);
  });

  it('findOne throws when symptom is missing', async () => {
    expect.assertions(1);
    const symptomId = '00000000-0000-4000-8000-000000000101';
    findByIdMock.mockResolvedValue(null);
    await expect(service.findOne(symptomId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
