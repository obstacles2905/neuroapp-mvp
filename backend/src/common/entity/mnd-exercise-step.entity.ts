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
import { MndExerciseBlock } from './mnd-exercise-block.entity';

@Entity({ name: 'mnd_exercise_steps' })
export class MndExerciseStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exercise_block_id', type: 'uuid' })
  exerciseBlockId: string;

  @ManyToOne(() => MndExerciseBlock, (block) => block.slides, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise_block_id' })
  block: MndExerciseBlock;

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
