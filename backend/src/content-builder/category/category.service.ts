import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '../../common/entity/category.entity';
import { CategoryCatalogAudience } from '../../common/enums/category-catalog-audience.enum';
import { normalizeCategoryTags } from '../../common/helpers/normalize-category-tags.helper';
import { normalizeFeatureFlagKey } from '../../common/helpers/normalize-feature-flag-key.helper';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepository.findAllOrdered();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  create(dto: CreateCategoryDto): Promise<Category> {
    const entity = this.categoryRepository.create({
      title: dto.title,
      description: dto.description,
      order: dto.order ?? 0,
      isPublished: dto.isPublished ?? false,
      catalogAudience:
        dto.catalogAudience ?? CategoryCatalogAudience.PRODUCTION,
      catalogFeatureFlagKey: normalizeFeatureFlagKey(dto.catalogFeatureFlagKey),
      tags: normalizeCategoryTags(dto.tags),
    });
    return this.categoryRepository.save(entity);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.title !== undefined) {
      category.title = dto.title;
    }
    if (dto.description !== undefined) {
      category.description = dto.description;
    }
    if (dto.order !== undefined) {
      category.order = dto.order;
    }
    if (dto.isPublished !== undefined) {
      category.isPublished = dto.isPublished;
    }
    if (dto.catalogAudience !== undefined) {
      category.catalogAudience = dto.catalogAudience;
    }
    if (dto.catalogFeatureFlagKey !== undefined) {
      category.catalogFeatureFlagKey = normalizeFeatureFlagKey(
        dto.catalogFeatureFlagKey,
      );
    }
    if (dto.tags !== undefined) {
      category.tags = normalizeCategoryTags(dto.tags);
    }
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    if (category.catalogAudience === CategoryCatalogAudience.PRODUCTION) {
      throw new BadRequestException(
        'Сначала деактивируйте категорию, затем удаление станет доступно.',
      );
    }
    await this.categoryRepository.remove(category);
  }
}
