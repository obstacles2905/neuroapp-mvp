import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { LessonContentBlockType } from '../enums/lesson-content-block-type.enum';
import { MndExercise } from './mnd-exercise.entity';
import { MndExerciseStep } from './mnd-exercise-step.entity';

@Entity({ name: 'mnd_exercise_blocks' })
@Unique(['exerciseId', 'blockType'])
export class MndExerciseBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'exercise_id', type: 'uuid' })
  exerciseId: string;

  @ManyToOne(() => MndExercise, (exercise) => exercise.blocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: MndExercise;

  @Column({ type: 'enum', enum: LessonContentBlockType, name: 'block_type' })
  blockType: LessonContentBlockType;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  order: number;

  @OneToMany(() => MndExerciseStep, (step) => step.block)
  slides: MndExerciseStep[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
