import type {
  AppLessonBlock,
  AppLessonStep,
  LessonContentBlockType,
} from '@/lib/api/types/lessons.types';

export type LessonStepInBlock = {
  step: AppLessonStep;
  blockType: LessonContentBlockType;
};

export function flattenLessonBlocks(blocks: AppLessonBlock[]): LessonStepInBlock[] {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  const out: LessonStepInBlock[] = [];
  for (const b of sortedBlocks) {
    const steps = [...b.steps].sort((a, c) => a.order - c.order);
    for (const s of steps) {
      out.push({ step: s, blockType: b.blockType });
    }
  }
  return out;
}
