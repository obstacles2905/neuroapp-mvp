import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MndExerciseDirection } from '../enums/mnd-exercise-direction.enum';
import type { MndExerciseContent } from '../interfaces/mnd-exercise-content.interface';
import type { I18nJsonField } from '../types/i18n-json.type';
import { MndExerciseBlock } from './mnd-exercise-block.entity';
import { MndMasterStack } from './mnd-master-stack.entity';

@Entity({ name: 'mnd_exercises' })
@Check('"complexity_level" >= 1 AND "complexity_level" <= 15')
export class MndExercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'master_stack_id', type: 'uuid' })
  masterStackId: string;

  @ManyToOne(() => MndMasterStack, (stack) => stack.exercises, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'master_stack_id' })
  masterStack: MndMasterStack;

  @Column({ type: 'enum', enum: MndExerciseDirection })
  direction: MndExerciseDirection;

  @Column({ name: 'complexity_level', type: 'int' })
  complexityLevel: number;

  @Column({ type: 'jsonb' })
  title: I18nJsonField;

  @Column({ type: 'jsonb', nullable: true })
  content: MndExerciseContent | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  order: number;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @OneToMany(() => MndExerciseBlock, (block) => block.exercise)
  blocks: MndExerciseBlock[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
