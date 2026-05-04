import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LessonStatus } from '../enums/lesson-status.enum';
import type { I18nJsonField } from '../types/i18n-json.type';
import { Category } from './category.entity';
import { LessonBlock } from './lesson-block.entity';

@Entity({ name: 'lessons' })
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'jsonb' })
  title: I18nJsonField;

  @Column({ type: 'enum', enum: LessonStatus, default: LessonStatus.DRAFT })
  status: LessonStatus;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  order: number;

  @OneToMany(() => LessonBlock, (block) => block.lesson)
  blocks: LessonBlock[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
