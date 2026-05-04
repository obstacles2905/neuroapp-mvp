import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MndMasterStackCode } from '../enums/mnd-master-stack-code.enum';
import type { I18nJsonField } from '../types/i18n-json.type';
import { MndExercise } from './mnd-exercise.entity';
import { MndMatrixRuleStack } from './mnd-matrix-rule-stack.entity';

@Entity({ name: 'mnd_master_stacks' })
export class MndMasterStack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MndMasterStackCode, unique: true })
  code: MndMasterStackCode;

  @Column({ type: 'jsonb' })
  title: I18nJsonField;

  @Column({ type: 'jsonb' })
  description: I18nJsonField;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  order: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => MndExercise, (exercise) => exercise.masterStack)
  exercises: MndExercise[];

  @OneToMany(() => MndMatrixRuleStack, (ruleStack) => ruleStack.masterStack)
  matrixRuleStacks: MndMatrixRuleStack[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
