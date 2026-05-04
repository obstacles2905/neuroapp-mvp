import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserLessonProgressStatus } from '../enums/user-lesson-progress-status.enum';
import { AppUser } from './app-user.entity';
import { Lesson } from './lesson.entity';

@Entity({ name: 'user_lesson_progress' })
@Unique(['appUserId', 'lessonId'])
export class UserLessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_user_id', type: 'uuid' })
  appUserId: string;

  @ManyToOne(() => AppUser, (user) => user.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_user_id' })
  appUser: AppUser;

  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: Lesson;

  @Column({ type: 'enum', enum: UserLessonProgressStatus })
  status: UserLessonProgressStatus;

  @Column({ name: 'percent_complete', type: 'int', default: 0 })
  percentComplete: number;

  @Column({ name: 'last_viewed_step_id', type: 'uuid', nullable: true })
  lastViewedStepId: string | null;

  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt: Date | null;

  @Column({ name: 'lesson_completed_at', type: 'timestamptz', nullable: true })
  lessonCompletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
