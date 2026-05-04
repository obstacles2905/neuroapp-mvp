import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../common/entity/category.entity';
import { CategoryCatalogAudience } from '../../common/enums/category-catalog-audience.enum';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  findAllOrdered(): Promise<Category[]> {
    return this.repository.find({ order: { order: 'ASC' } });
  }

  findById(id: string): Promise<Category | null> {
    return this.repository.findOne({ where: { id } });
  }

  findPublishedProductionOrdered(): Promise<Category[]> {
    return this.repository.find({
      where: {
        isPublished: true,
        catalogAudience: CategoryCatalogAudience.PRODUCTION,
      },
      order: { order: 'ASC' },
    });
  }

  findPublishedProductionById(id: string): Promise<Category | null> {
    return this.repository.findOne({
      where: {
        id,
        isPublished: true,
        catalogAudience: CategoryCatalogAudience.PRODUCTION,
      },
    });
  }

  save(entity: Category): Promise<Category> {
    return this.repository.save(entity);
  }

  async remove(entity: Category): Promise<void> {
    await this.repository.remove(entity);
  }

  create(data: Partial<Category>): Category {
    return this.repository.create(data);
  }
}
