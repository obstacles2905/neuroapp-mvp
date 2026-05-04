import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { MndMasterStack } from './mnd-master-stack.entity';
import { MndMatrixRule } from './mnd-matrix-rule.entity';

@Entity({ name: 'mnd_matrix_rule_stacks' })
@Unique(['ruleId', 'masterStackId'])
export class MndMatrixRuleStack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rule_id', type: 'uuid' })
  ruleId: string;

  @ManyToOne(() => MndMatrixRule, (rule) => rule.stacks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rule_id' })
  rule: MndMatrixRule;

  @Column({ name: 'master_stack_id', type: 'uuid' })
  masterStackId: string;

  @ManyToOne(() => MndMasterStack, (stack) => stack.matrixRuleStacks, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'master_stack_id' })
  masterStack: MndMasterStack;

  @Column({ type: 'int', default: 0 })
  priority: number;
}
