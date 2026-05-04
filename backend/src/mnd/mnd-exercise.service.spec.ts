import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MndExercise } from '../common/entity/mnd-exercise.entity';
import { MndExerciseDirection } from '../common/enums/mnd-exercise-direction.enum';
import { CreateMndExerciseDto } from './dto/create-mnd-exercise.dto';
import { MndExerciseService } from './mnd-exercise.service';
import { MndExerciseBlockRepository } from './repositories/mnd-exercise-block.repository';
import { MndExerciseRepository } from './repositories/mnd-exercise.repository';
import { MndMasterStackRepository } from './repositories/mnd-master-stack.repository';

describe('MndExerciseService', () => {
  let service: MndExerciseService;
  const exerciseFindByIdMock = jest.fn();
  const exerciseCreateMock = jest.fn();
  const exerciseSaveMock = jest.fn();
  const exerciseRemoveMock = jest.fn();
  const exerciseFindAllOrderedMock = jest.fn();
  const exerciseFindByIdWithRelationsMock = jest.fn();
  const createDefaultBlocksForExerciseMock = jest.fn();
  const stackFindByIdMock = jest.fn();

  beforeEach(async () => {
    exerciseFindByIdMock.mockReset();
    exerciseCreateMock.mockReset();
    exerciseSaveMock.mockReset();
    exerciseRemoveMock.mockReset();
    exerciseFindAllOrderedMock.mockReset();
    exerciseFindByIdWithRelationsMock.mockReset();
    createDefaultBlocksForExerciseMock.mockReset();
    stackFindByIdMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MndExerciseService,
        {
          provide: MndExerciseRepository,
          useValue: {
            findAllOrdered: exerciseFindAllOrderedMock,
            findById: exerciseFindByIdMock,
            findByIdWithRelations: exerciseFindByIdWithRelationsMock,
            create: exerciseCreateMock,
            save: exerciseSaveMock,
            remove: exerciseRemoveMock,
          },
        },
        {
          provide: MndExerciseBlockRepository,
          useValue: {
            createDefaultBlocksForExercise: createDefaultBlocksForExerciseMock,
          },
        },
        {
          provide: MndMasterStackRepository,
          useValue: { findById: stackFindByIdMock },
        },
      ],
    }).compile();

    service = module.get(MndExerciseService);
  });

  it('create rejects unknown master stack', async () => {
    expect.assertions(1);
    const masterStackId = '00000000-0000-4000-8000-000000000301';
    const dto = buildExerciseDto(masterStackId);
    stackFindByIdMock.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create persists exercise defaults', async () => {
    expect.assertions(2);
    const masterStackId = '00000000-0000-4000-8000-000000000302';
    const dto = buildExerciseDto(masterStackId);
    const created = { id: 'exercise-id' } as MndExercise;
    stackFindByIdMock.mockResolvedValue({ id: masterStackId });
    exerciseCreateMock.mockReturnValue(created);
    exerciseSaveMock.mockResolvedValue(created);
    createDefaultBlocksForExerciseMock.mockResolvedValue(undefined);
    exerciseFindByIdWithRelationsMock.mockResolvedValue({ ...created, blocks: [] });

    const result = await service.create(dto);

    expect(exerciseCreateMock).toHaveBeenCalledWith({
      ...dto,
      content: null,
      order: 0,
      isPublished: false,
    });
    expect(result).toEqual({ ...created, blocks: [] });
  });

  it('findOnePublishedForApp rejects unpublished', async () => {
    expect.assertions(1);
    const exerciseId = '40000000-0000-4000-8000-000000000101';
    exerciseFindByIdWithRelationsMock.mockResolvedValue({
      id: exerciseId,
      isPublished: false,
      blocks: [{ slides: [] }],
    } as MndExercise);

    await expect(service.findOnePublishedForApp(exerciseId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  function buildExerciseDto(masterStackId: string): CreateMndExerciseDto {
    const title = { ru: 'Ушной тумблер', uk: 'Вушний тумблер', en: 'Ear Tug' };
    return {
      masterStackId,
      direction: MndExerciseDirection.BOTTOM_UP,
      complexityLevel: 1,
      title,
    };
  }
});
