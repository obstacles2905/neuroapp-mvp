import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppUser } from './app-user.entity';

@Entity({ name: 'app_user_usage_daily' })
@Index(['appUserId', 'localDay'], { unique: true })
export class AppUserUsageDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_user_id', type: 'uuid' })
  appUserId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_user_id' })
  appUser: AppUser;

  /** YYYY-MM-DD в часовом поясе пользователя */
  @Column({ name: 'local_day', type: 'varchar', length: 10 })
  localDay: string;

  @Column({ name: 'app_ms', type: 'bigint', default: 0 })
  appMs: string;

  @Column({ name: 'exercise_ms', type: 'bigint', default: 0 })
  exerciseMs: string;

  @Column({ name: 'session_count', type: 'int', default: 0 })
  sessionCount: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
