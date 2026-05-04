import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { OnboardingCategoryRankItem } from '../types/onboarding-category-rank.type';
import type { OnboardingSymptomRankItem } from '../types/onboarding-symptom-rank.type';
import { UserLessonProgress } from './user-lesson-progress.entity';

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

  @Column({ name: 'onboarding_completed_at', type: 'timestamptz', nullable: true })
  onboardingCompletedAt: Date | null;

  @Column({ name: 'onboarding_skipped_at', type: 'timestamptz', nullable: true })
  onboardingSkippedAt: Date | null;

  @Column({ name: 'onboarding_category_weights', type: 'jsonb', nullable: true })
  onboardingCategoryRanks: OnboardingCategoryRankItem[] | null;

  @Column({ name: 'onboarding_symptom_ranks', type: 'jsonb', nullable: true })
  onboardingSymptomRanks: OnboardingSymptomRankItem[] | null;

  @OneToMany(() => UserLessonProgress, (progress) => progress.appUser)
  progress: UserLessonProgress[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  /** Текущая серия календарных дней (UTC) с ≥1 событием «активности» */
  @Column({ name: 'activity_streak_count', type: 'int', default: 0 })
  activityStreakCount: number;

  /** Дата (UTC) последнего дня, зачтённого в стрик: YYYY-MM-DD */
  @Column({ name: 'activity_streak_last_utc_date', type: 'date', nullable: true })
  activityStreakLastUtcDate: string | null;
}
