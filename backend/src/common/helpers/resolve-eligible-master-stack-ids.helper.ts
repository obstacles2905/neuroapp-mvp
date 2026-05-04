import type { MndMatrixRule } from '../entity/mnd-matrix-rule.entity';

function sortedStackIdsForRule(rule: MndMatrixRule): string[] {
  return [...rule.stacks].sort((a, b) => a.priority - b.priority).map((s) => s.masterStackId);
}

function averagePriorityForStack(stackId: string, rules: MndMatrixRule[]): number {
  let sum = 0;
  let n = 0;
  for (const rule of rules) {
    const st = rule.stacks.find((s) => s.masterStackId === stackId);
    if (st) {
      sum += st.priority;
      n += 1;
    }
  }
  return n === 0 ? 999 : sum / n;
}

function countRulesWithStack(stackId: string, rules: MndMatrixRule[]): number {
  let c = 0;
  for (const rule of rules) {
    if (rule.stacks.some((s) => s.masterStackId === stackId)) {
      c += 1;
    }
  }
  return c;
}

function minPriorityForStack(stackId: string, rules: MndMatrixRule[]): number {
  let m = 999;
  for (const rule of rules) {
    const st = rule.stacks.find((s) => s.masterStackId === stackId);
    if (st !== undefined && st.priority < m) {
      m = st.priority;
    }
  }
  return m;
}

/**
 * Пересечение приоритетных стеков по симптомам; если пусто — объединение со скорингом
 * (как в этапе 3 MND: пересечение, иначе обобщение).
 */
export function resolveEligibleMasterStackIds(rules: MndMatrixRule[]): string[] {
  if (rules.length === 0) {
    return [];
  }
  const perRule = rules.map(sortedStackIdsForRule);
  const first = new Set(perRule[0]!);
  let intersection = first;
  for (let i = 1; i < perRule.length; i++) {
    const next = new Set(perRule[i]!);
    intersection = new Set([...intersection].filter((id) => next.has(id)));
  }
  if (intersection.size > 0) {
    return [...intersection].sort(
      (a, b) =>
        averagePriorityForStack(a, rules) - averagePriorityForStack(b, rules) ||
        a.localeCompare(b),
    );
  }
  const union = new Set<string>();
  for (const row of perRule) {
    row.forEach((id) => union.add(id));
  }
  return [...union].sort((a, b) => {
    const cb = countRulesWithStack(b, rules);
    const ca = countRulesWithStack(a, rules);
    if (cb !== ca) {
      return cb - ca;
    }
    return minPriorityForStack(a, rules) - minPriorityForStack(b, rules);
  });
}
