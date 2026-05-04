import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoryCatalogAudience } from '../enums/category-catalog-audience.enum';
import type { I18nJsonField } from '../types/i18n-json.type';
import { Lesson } from './lesson.entity';

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  title: I18nJsonField;

  @Column({ type: 'jsonb' })
  description: I18nJsonField;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  order: number;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @Column({
    name: 'catalog_audience',
    type: 'enum',
    enum: CategoryCatalogAudience,
    default: CategoryCatalogAudience.PRODUCTION,
  })
  catalogAudience: CategoryCatalogAudience;

  @Column({
    name: 'catalog_feature_flag_key',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  catalogFeatureFlagKey: string | null;

  @Column({ name: 'tags', type: 'text', array: true, default: '{}' })
  tags: string[];

  @OneToMany(() => Lesson, (lesson) => lesson.category)
  lessons: Lesson[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
