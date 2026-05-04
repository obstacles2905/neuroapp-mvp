import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { I18nJsonField } from '../types/i18n-json.type';
import { MndMatrixRuleStack } from './mnd-matrix-rule-stack.entity';
import { MndSymptom } from './mnd-symptom.entity';

@Entity({ name: 'mnd_matrix_rules' })
@Check('"bottom_up_percent" >= 0 AND "bottom_up_percent" <= 100')
@Check('"top_down_percent" >= 0 AND "top_down_percent" <= 100')
@Check('"bottom_up_percent" + "top_down_percent" = 100')
export class MndMatrixRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'symptom_id', type: 'uuid', unique: true })
  symptomId: string;

  @OneToOne(() => MndSymptom, (symptom) => symptom.matrixRule, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'symptom_id' })
  symptom: MndSymptom;

  @Column({ name: 'target_action', type: 'jsonb' })
  targetAction: I18nJsonField;

  @Column({ name: 'bottom_up_percent', type: 'int' })
  bottomUpPercent: number;

  @Column({ name: 'top_down_percent', type: 'int' })
  topDownPercent: number;

  @OneToMany(() => MndMatrixRuleStack, (ruleStack) => ruleStack.rule, {
    cascade: true,
  })
  stacks: MndMatrixRuleStack[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
