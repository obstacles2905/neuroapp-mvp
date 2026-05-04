import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Lesson } from '../../common/entity/lesson.entity';
import { LessonStatus } from '../../common/enums/lesson-status.enum';
import {
  LessonContentBlockType,
  LESSON_CONTENT_BLOCK_TYPES_IN_ORDER,
} from '../../common/enums/lesson-content-block-type.enum';
import { LessonStepType } from '../../common/enums/lesson-step-type.enum';
import { CategoryRepository } from '../category/category.repository';
import { LessonBlockRepository } from '../lesson-block/lesson-block.repository';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { LessonRepository } from './lesson.repository';
import { LessonService } from './lesson.service';

describe('LessonService', () => {
  let service: LessonService;
  const findAllOrderedMock = jest.fn();
  const findByIdMock = jest.fn();
  const findByIdWithRelationsMock = jest.fn();
  const saveMock = jest.fn();
  const removeMock = jest.fn();
  const createMock = jest.fn();
  const categoryFindByIdMock = jest.fn();
  const createDefaultBlocksMock = jest.fn();

  beforeEach(async () => {
    findAllOrderedMock.mockReset();
    findByIdMock.mockReset();
    findByIdWithRelationsMock.mockReset();
    saveMock.mockReset();
    removeMock.mockReset();
    createMock.mockReset();
    categoryFindByIdMock.mockReset();
    createDefaultBlocksMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonService,
        {
          provide: LessonRepository,
          useValue: {
            findAllOrdered: findAllOrderedMock,
            findById: findByIdMock,
            findByIdWithRelations: findByIdWithRelationsMock,
            save: saveMock,
            remove: removeMock,
            create: createMock,
          },
        },
        {
          provide: CategoryRepository,
          useValue: { findById: categoryFindByIdMock },
        },
        {
          provide: LessonBlockRepository,
          useValue: {
            createDefaultBlocksForLesson: createDefaultBlocksMock,
          },
        },
      ],
    }).compile();

    service = module.get(LessonService);
  });

  it('create requires existing category', async () => {
    expect.assertions(1);
    const categoryId = '00000000-0000-4000-8000-000000000002';
    const dto: CreateLessonDto = {
      categoryId,
      title: { ru: 'a', uk: 'a', en: 'a' },
    };
    categoryFindByIdMock.mockResolvedValue(null);
    await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create saves lesson and returns hydrated record', async () => {
    expect.assertions(3);
    const categoryId = '00000000-0000-4000-8000-000000000003';
    const lessonId = '00000000-0000-4000-8000-000000000004';
    const dto: CreateLessonDto = {
      categoryId,
      title: { ru: 'a', uk: 'a', en: 'a' },
      status: LessonStatus.DRAFT,
    };
    const draft = { id: lessonId } as Lesson;
    const hydrated = { id: lessonId, blocks: [] } as unknown as Lesson;

    categoryFindByIdMock.mockResolvedValue({ id: categoryId });
    createMock.mockReturnValue(draft);
    saveMock.mockResolvedValue(draft);
    createDefaultBlocksMock.mockResolvedValue(undefined);
    findByIdWithRelationsMock.mockResolvedValue(hydrated);

    const result = await service.create(dto);

    expect(saveMock).toHaveBeenCalled();
    expect(createDefaultBlocksMock).toHaveBeenCalledWith(lessonId);
    expect(result).toBe(hydrated);
  });

  it('publish rejects lesson without slides in a block', async () => {
    expect.assertions(1);
    const lessonId = '00000000-0000-4000-8000-000000000010';
    findByIdWithRelationsMock.mockResolvedValue({
      id: lessonId,
      blocks: [
        {
          order: 0,
          blockType: LessonContentBlockType.WHAT_EXERCISE,
          slides: [],
        },
      ],
    });
    await expect(service.publish(lessonId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('remove rejects published lesson', async () => {
    expect.assertions(2);
    const lessonId = '00000000-0000-4000-8000-000000000020';
    findByIdMock.mockResolvedValue({
      id: lessonId,
      status: LessonStatus.PUBLISHED,
    } as Lesson);
    await expect(service.remove(lessonId)).rejects.toBeInstanceOf(BadRequestException);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('remove deletes draft lesson', async () => {
    expect.assertions(2);
    const lessonId = '00000000-0000-4000-8000-000000000021';
    const draft = { id: lessonId, status: LessonStatus.DRAFT } as Lesson;
    findByIdMock.mockResolvedValue(draft);
    removeMock.mockResolvedValue(undefined);

    await service.remove(lessonId);

    expect(findByIdMock).toHaveBeenCalledWith(lessonId);
    expect(removeMock).toHaveBeenCalledWith(draft);
  });

  it('publish saves published status when slides are valid', async () => {
    expect.assertions(2);
    const lessonId = '00000000-0000-4000-8000-000000000011';
    const step = {
      type: LessonStepType.THEORY,
      content: {
        display_mode: 'all',
        sentences: { ru: ['x'], uk: ['x'], en: ['x'] },
      },
    };
    const blocks = LESSON_CONTENT_BLOCK_TYPES_IN_ORDER.map((blockType, order) => ({
      order,
      blockType,
      slides:
        order === 0
          ? [step]
          : [
              {
                type: LessonStepType.THEORY,
                content: {
                  display_mode: 'all',
                  sentences: { ru: ['x'], uk: ['x'], en: ['x'] },
                },
              },
            ],
    }));
    const draftLesson = {
      id: lessonId,
      blocks,
      status: LessonStatus.DRAFT,
    } as Lesson;
    const publishedLesson = {
      ...draftLesson,
      status: LessonStatus.PUBLISHED,
    } as Lesson;
    findByIdWithRelationsMock
      .mockResolvedValueOnce(draftLesson)
      .mockResolvedValueOnce(publishedLesson);
    saveMock.mockResolvedValue(publishedLesson);

    const result = await service.publish(lessonId);

    expect(saveMock).toHaveBeenCalled();
    expect(result.status).toBe(LessonStatus.PUBLISHED);
  });
});
