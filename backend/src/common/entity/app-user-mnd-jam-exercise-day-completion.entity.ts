import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'app_user_mnd_jam_exercise_day_completions' })
@Index(['appUserId', 'dayKeyUtc', 'mndExerciseId'], { unique: true })
export class AppUserMndJamExerciseDayCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_user_id', type: 'uuid' })
  appUserId: string;

  @Column({ name: 'day_key_utc', type: 'varchar', length: 10 })
  dayKeyUtc: string;

  @Column({ name: 'mnd_exercise_id', type: 'uuid' })
  mndExerciseId: string;

  @CreateDateColumn({ name: 'completed_at', type: 'timestamptz' })
  completedAt: Date;
}
