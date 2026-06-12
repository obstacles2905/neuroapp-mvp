import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MndSymptom } from './mnd-symptom.entity';

@Entity({ name: 'architect_word_videos' })
@Index(['symptomId', 'slot'], { unique: true })
export class ArchitectWordVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'symptom_id', type: 'uuid' })
  symptomId: string;

  @ManyToOne(() => MndSymptom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'symptom_id' })
  symptom: MndSymptom;

  @Column({ type: 'int' })
  slot: number;

  @Column({ name: 's3_key', type: 'varchar', length: 512, nullable: true })
  s3Key: string | null;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
