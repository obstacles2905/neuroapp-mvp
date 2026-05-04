import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LessonStepType } from '../enums/lesson-step-type.enum';
import type { LessonStepContent } from '../interfaces/lesson-step-content.interface';
import { LessonBlock } from './lesson-block.entity';

@Entity({ name: 'lesson_steps' })
export class LessonStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lesson_block_id', type: 'uuid' })
  lessonBlockId: string;

  @ManyToOne(() => LessonBlock, (block) => block.slides, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_block_id' })
  block: LessonBlock;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  order: number;

  @Column({ type: 'enum', enum: LessonStepType })
  type: LessonStepType;

  @Column({ type: 'jsonb' })
  content: LessonStepContent;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
