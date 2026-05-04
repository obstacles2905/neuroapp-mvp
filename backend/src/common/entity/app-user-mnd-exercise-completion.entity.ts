import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppUser } from './app-user.entity';
import { MndExercise } from './mnd-exercise.entity';

@Entity({ name: 'app_user_mnd_exercise_completions' })
@Index(['appUserId', 'mndExerciseId'], { unique: true })
export class AppUserMndExerciseCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_user_id', type: 'uuid' })
  appUserId: string;

  @Column({ name: 'mnd_exercise_id', type: 'uuid' })
  mndExerciseId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_user_id' })
  appUser: AppUser;

  @ManyToOne(() => MndExercise, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mnd_exercise_id' })
  mndExercise: MndExercise;

  @CreateDateColumn({ name: 'first_completed_at', type: 'timestamptz' })
  firstCompletedAt: Date;
}
