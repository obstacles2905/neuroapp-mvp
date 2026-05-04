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
import { Lesson } from './lesson.entity';
import { LessonStep } from './lesson-step.entity';

@Entity({ name: 'lesson_blocks' })
@Unique(['lessonId', 'blockType'])
export class LessonBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.blocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column({ type: 'enum', enum: LessonContentBlockType, name: 'block_type' })
  blockType: LessonContentBlockType;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  order: number;

  @OneToMany(() => LessonStep, (step) => step.block)
  slides: LessonStep[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
