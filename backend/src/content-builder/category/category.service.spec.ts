import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Category } from '../../common/entity/category.entity';
import { CategoryCatalogAudience } from '../../common/enums/category-catalog-audience.enum';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryRepository } from './category.repository';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  const findByIdMock = jest.fn();
  const findAllOrderedMock = jest.fn();
  const saveMock = jest.fn();
  const removeMock = jest.fn();
  const createMock = jest.fn();

  beforeEach(async () => {
    findByIdMock.mockReset();
    findAllOrderedMock.mockReset();
    saveMock.mockReset();
    removeMock.mockReset();
    createMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: {
            findById: findByIdMock,
            findAllOrdered: findAllOrderedMock,
            save: saveMock,
            remove: removeMock,
            create: createMock,
          },
        },
      ],
    }).compile();

    service = module.get(CategoryService);
  });

  it('findAll delegates to repository', async () => {
    expect.assertions(1);
    const expected: Category[] = [];
    findAllOrderedMock.mockResolvedValue(expected);
    const result = await service.findAll();
    expect(result).toBe(expected);
  });

  it('findOne throws when missing', async () => {
    expect.assertions(1);
    const categoryId = '00000000-0000-4000-8000-000000000001';
    findByIdMock.mockResolvedValue(null);
    await expect(service.findOne(categoryId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('create persists new category', async () => {
    expect.assertions(2);
    const dto: CreateCategoryDto = {
      title: { ru: 't', uk: 't', en: 't' },
      description: { ru: 'd', uk: 'd', en: 'd' },
    };
    const created = { id: 'cat' } as Category;
    createMock.mockReturnValue(created);
    saveMock.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(createMock).toHaveBeenCalledWith({
      title: dto.title,
      description: dto.description,
      order: 0,
      isPublished: false,
      catalogAudience: CategoryCatalogAudience.PRODUCTION,
      catalogFeatureFlagKey: null,
      tags: [],
    });
    expect(result).toBe(created);
  });

  it('create sets experimental audience and flag key when provided', async () => {
    expect.assertions(2);
    const flagKey = 'beta_sleep_category';
    const dto: CreateCategoryDto = {
      title: { ru: 't', uk: 't', en: 't' },
      description: { ru: 'd', uk: 'd', en: 'd' },
      catalogAudience: CategoryCatalogAudience.EXPERIMENTAL,
      catalogFeatureFlagKey: `  ${flagKey}  `,
    };
    const created = { id: 'cat-exp' } as Category;
    createMock.mockReturnValue(created);
    saveMock.mockResolvedValue(created);

    const result = await service.create(dto);

    expect(createMock).toHaveBeenCalledWith({
      title: dto.title,
      description: dto.description,
      order: 0,
      isPublished: false,
      catalogAudience: CategoryCatalogAudience.EXPERIMENTAL,
      catalogFeatureFlagKey: flagKey,
      tags: [],
    });
    expect(result).toBe(created);
  });

  it('remove throws when category is in production', async () => {
    expect.assertions(1);
    const categoryId = '00000000-0000-4000-8000-000000000002';
    findByIdMock.mockResolvedValue({
      id: categoryId,
      catalogAudience: CategoryCatalogAudience.PRODUCTION,
    });
    await expect(service.remove(categoryId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('remove deletes when category is experimental', async () => {
    expect.assertions(2);
    const categoryId = '00000000-0000-4000-8000-000000000003';
    const existing = {
      id: categoryId,
      catalogAudience: CategoryCatalogAudience.EXPERIMENTAL,
    } as Category;
    findByIdMock.mockResolvedValue(existing);
    removeMock.mockResolvedValue(undefined);

    await service.remove(categoryId);

    expect(removeMock).toHaveBeenCalledWith(existing);
    expect(findByIdMock).toHaveBeenCalledWith(categoryId);
  });
});
