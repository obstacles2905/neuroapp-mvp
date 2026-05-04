import { resolveEligibleMasterStackIds } from './resolve-eligible-master-stack-ids.helper';
import type { MndMatrixRule } from '../entity/mnd-matrix-rule.entity';
import type { MndMatrixRuleStack } from '../entity/mnd-matrix-rule-stack.entity';

function stack(pid: string, pri: number): MndMatrixRuleStack {
  return {
    masterStackId: pid,
    priority: pri,
  } as MndMatrixRuleStack;
}

describe('resolveEligibleMasterStackIds', () => {
  it('uses intersection when non-empty', () => {
    expect.assertions(1);
    const stA = '10000000-0000-4000-8000-000000000004';
    const stB = '10000000-0000-4000-8000-000000000005';
    const rules = [
      {
        stacks: [stack(stB, 0), stack(stA, 1)],
      },
      {
        stacks: [stack(stA, 1), stack(stB, 0)],
      },
    ] as MndMatrixRule[];
    const result = resolveEligibleMasterStackIds(rules);
    expect(result).toEqual([stB, stA]);
  });

  it('falls back to union when intersection empty', () => {
    expect.assertions(1);
    const s1 = '10000000-0000-4000-8000-000000000001';
    const s2 = '10000000-0000-4000-8000-000000000002';
    const rules = [
      { stacks: [stack(s1, 0)] },
      { stacks: [stack(s2, 0)] },
    ] as MndMatrixRule[];
    const result = resolveEligibleMasterStackIds(rules);
    expect(result).toEqual([s1, s2]);
  });
});
