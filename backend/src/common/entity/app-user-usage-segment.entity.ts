import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsageSegmentContext } from '../enums/usage-segment-context.enum';
import { UsageSegmentKind } from '../enums/usage-segment-kind.enum';
import { AppUser } from './app-user.entity';

@Entity({ name: 'app_user_usage_segments' })
@Index(['appUserId', 'clientEventId'], { unique: true })
@Index(['appUserId', 'endedAt'])
export class AppUserUsageSegment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_user_id', type: 'uuid' })
  appUserId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_user_id' })
  appUser: AppUser;

  @Column({ name: 'client_event_id', type: 'varchar', length: 64 })
  clientEventId: string;

  @Column({ type: 'enum', enum: UsageSegmentKind })
  kind: UsageSegmentKind;

  @Column({ type: 'enum', enum: UsageSegmentContext })
  context: UsageSegmentContext;

  @Column({ name: 'context_id', type: 'uuid', nullable: true })
  contextId: string | null;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz' })
  endedAt: Date;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;

  /** Календарный день пользователя (IANA TZ), к которому отнесена длительность */
  @Column({ name: 'local_day', type: 'varchar', length: 10 })
  localDay: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
