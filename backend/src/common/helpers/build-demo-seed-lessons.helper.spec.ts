import {
  buildDemoSeedLessons,
  DEMO_SEED_CATEGORIES,
  DEMO_SEED_LESSONS_PER_CATEGORY,
  DEMO_SEED_STEPS,
} from './build-demo-seed-lessons.helper';

describe('buildDemoSeedLessons', () => {
  it('builds full grid of demo lessons', () => {
    expect.assertions(4);
    const rows = buildDemoSeedLessons();
    const expected =
      DEMO_SEED_CATEGORIES * DEMO_SEED_LESSONS_PER_CATEGORY;
    expect(rows).toHaveLength(expected);
    expect(rows[0]!.steps).toHaveLength(DEMO_SEED_STEPS);
    expect(new Set(rows.map((r) => r.id)).size).toBe(expected);
    expect(new Set(rows.flatMap((r) => r.steps.map((s) => s.id))).size).toBe(
      expected * DEMO_SEED_STEPS,
    );
  });
});
