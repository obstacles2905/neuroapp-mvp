import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ArchitectWordPlaylistSnapshot } from '../types/architect-word-playlist-snapshot.type';
import type { OnboardingSymptomRankItem } from '../types/onboarding-symptom-rank.type';

@Entity({ name: 'app_users' })
export class AppUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'external_id',
    type: 'varchar',
    length: 128,
    nullable: true,
    unique: true,
  })
  externalId: string | null;

  @Column({ type: 'varchar', length: 320, nullable: true, unique: true })
  email: string | null;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  displayName: string | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 120,
    nullable: true,
    select: false,
  })
  passwordHash: string | null;

  @Column({
    name: 'onboarding_completed_at',
    type: 'timestamptz',
    nullable: true,
  })
  onboardingCompletedAt: Date | null;

  @Column({
    name: 'onboarding_skipped_at',
    type: 'timestamptz',
    nullable: true,
  })
  onboardingSkippedAt: Date | null;

  @Column({ name: 'onboarding_symptom_ranks', type: 'jsonb', nullable: true })
  onboardingSymptomRanks: OnboardingSymptomRankItem[] | null;

  @Column({
    name: 'architect_word_seen_at',
    type: 'timestamptz',
    nullable: true,
  })
  architectWordSeenAt: Date | null;

  @Column({
    name: 'architect_word_playlist_snapshot',
    type: 'jsonb',
    nullable: true,
  })
  architectWordPlaylistSnapshot: ArchitectWordPlaylistSnapshot | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'activity_streak_count', type: 'int', default: 0 })
  activityStreakCount: number;

  @Column({
    name: 'activity_streak_last_completed_at',
    type: 'timestamptz',
    nullable: true,
  })
  activityStreakLastCompletedAt: Date | null;

  @Column({
    name: 'usage_timezone',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  usageTimezone: string | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;
}
