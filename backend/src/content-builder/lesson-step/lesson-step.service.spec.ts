import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LessonStepType } from '../../common/enums/lesson-step-type.enum';
import { CreateLessonStepDto } from '../dto/create-lesson-step.dto';
import { LessonBlockRepository } from '../lesson-block/lesson-block.repository';
import { LessonRepository } from '../lesson/lesson.repository';
import { LessonStepRepository } from './lesson-step.repository';
import { LessonStepService } from './lesson-step.service';

describe('LessonStepService', () => {
  let service: LessonStepService;
  const findByBlockIdOrderedMock = jest.fn();
  const findByIdAndBlockMock = jest.fn();
  const saveMock = jest.fn();
  const removeMock = jest.fn();
  const createMock = jest.fn();
  const updateOrdersMock = jest.fn();
  const lessonFindByIdMock = jest.fn();
  const blockFindByIdAndLessonMock = jest.fn();

  beforeEach(async () => {
    findByBlockIdOrderedMock.mockReset();
    findByIdAndBlockMock.mockReset();
    saveMock.mockReset();
    removeMock.mockReset();
    createMock.mockReset();
    updateOrdersMock.mockReset();
    lessonFindByIdMock.mockReset();
    blockFindByIdAndLessonMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonStepService,
        {
          provide: LessonStepRepository,
          useValue: {
            findByBlockIdOrdered: findByBlockIdOrderedMock,
            findByIdAndBlock: findByIdAndBlockMock,
            save: saveMock,
            remove: removeMock,
            create: createMock,
            updateOrders: updateOrdersMock,
          },
        },
        {
          provide: LessonRepository,
          useValue: { findById: lessonFindByIdMock },
        },
        {
          provide: LessonBlockRepository,
          useValue: { findByIdAndLesson: blockFindByIdAndLessonMock },
        },
      ],
    }).compile();

    service = module.get(LessonStepService);
  });

  it('create rejects invalid content', async () => {
    expect.assertions(1);
    const lessonId = '00000000-0000-4000-8000-000000000020';
    const blockId = '00000000-0000-4000-8000-000000000021';
    lessonFindByIdMock.mockResolvedValue({ id: lessonId });
    blockFindByIdAndLessonMock.mockResolvedValue({ id: blockId, lessonId });
    const dto: CreateLessonStepDto = {
      type: LessonStepType.THEORY,
      content: { display_mode: 'bad', sentences: { ru: [], uk: [], en: [] } },
    };
    await expect(service.create(lessonId, blockId, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
