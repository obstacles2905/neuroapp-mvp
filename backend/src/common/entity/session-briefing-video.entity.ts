import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SessionBriefingPhase } from '../enums/session-briefing-phase.enum';

@Entity({ name: 'session_briefing_videos' })
@Index(['phase'], { unique: true })
export class SessionBriefingVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SessionBriefingPhase })
  phase: SessionBriefingPhase;

  @Column({ name: 's3_key', type: 'varchar', length: 512, nullable: true })
  s3Key: string | null;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
