import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { I18nJsonField } from '../types/i18n-json.type';
import { MndMatrixRule } from './mnd-matrix-rule.entity';

@Entity({ name: 'mnd_symptoms' })
export class MndSymptom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  code: string;

  @Column({ type: 'jsonb' })
  title: I18nJsonField;

  @Column({ type: 'jsonb' })
  description: I18nJsonField;

  @Column({ name: 'neurophysiological_root', type: 'jsonb' })
  neurophysiologicalRoot: I18nJsonField;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  order: number;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @OneToOne(() => MndMatrixRule, (rule) => rule.symptom)
  matrixRule: MndMatrixRule | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
