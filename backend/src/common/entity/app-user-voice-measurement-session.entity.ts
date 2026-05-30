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
import type {
  IVoiceAcousticSnapshotJson,
  IVoiceComparisonJson,
  IVoiceCoreMetricsJson,
  IVoiceInterpretationJson,
  IVoiceProductMetricsJson,
  IVoiceQualityResultJson,
} from '../interfaces/voice-measurement-session-json.interface';
import { AppUser } from './app-user.entity';

@Entity({ name: 'app_user_voice_measurement_sessions' })
@Unique(['appUserId', 'sessionId'])
export class AppUserVoiceMeasurementSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'app_user_id', type: 'uuid' })
  appUserId: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'app_user_id' })
  appUser: AppUser;

  /** Идемпотентный UUID клиента (`VoiceMeasurementSession.id`). */
  @Column({ name: 'session_id', type: 'varchar', length: 64 })
  sessionId: string;

  @Column({ name: 'captured_at', type: 'timestamptz' })
  capturedAt: Date;

  @Column({ name: 'protocol_version', type: 'varchar', length: 64 })
  protocolVersion: string;

  @Column({ name: 'extractor_id', type: 'varchar', length: 32 })
  extractorId: string;

  @Column({ name: 'extractor_version', type: 'varchar', length: 64 })
  extractorVersion: string;

  @Column({ name: 'feature_set', type: 'varchar', length: 64 })
  featureSet: string;

  @Column({ name: 'scoring_version', type: 'varchar', length: 64 })
  scoringVersion: string;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number;

  @Column({ type: 'jsonb' })
  quality: IVoiceQualityResultJson;

  @Column({ type: 'jsonb' })
  metrics: IVoiceProductMetricsJson;

  @Column({ type: 'jsonb', nullable: true })
  interpretation: IVoiceInterpretationJson | null;

  @Column({ name: 'core_metrics', type: 'jsonb', nullable: true })
  coreMetrics: IVoiceCoreMetricsJson | null;

  @Column({ type: 'jsonb', nullable: true })
  comparison: IVoiceComparisonJson | null;

  @Column({ name: 'acoustic_snapshot', type: 'jsonb', nullable: true })
  acousticSnapshot: IVoiceAcousticSnapshotJson | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
