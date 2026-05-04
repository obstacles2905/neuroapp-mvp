import type { LessonBlock } from '@/lib/types/api';
import type { LessonStep } from '@/lib/types/lesson-step';
import { create } from 'zustand';

function sortBlocks(blocks: LessonBlock[]): LessonBlock[] {
  return [...blocks]
    .sort((a, b) => a.order - b.order)
    .map((b) => ({
      ...b,
      slides: [...(b.slides ?? [])].sort((x, y) => x.order - y.order),
    }));
}

type LessonBuilderState = {
  blocks: LessonBlock[];
  selectedBlockId: string | null;
  selectedStepId: string | null;
  setBlocks: (blocks: LessonBlock[]) => void;
  selectSlide: (blockId: string | null, stepId: string | null) => void;
  upsertSlide: (blockId: string, step: LessonStep) => void;
  appendSlide: (blockId: string, step: LessonStep) => void;
  removeSlide: (blockId: string, stepId: string) => void;
  setSlideOrderInBlock: (blockId: string, orderedIds: string[]) => void;
};

export const useLessonBuilderStore = create<LessonBuilderState>((set) => ({
  blocks: [],
  selectedBlockId: null,
  selectedStepId: null,
  setBlocks: (blocks) =>
    set((s) => {
      const sorted = sortBlocks(blocks);
      const selectionLost =
        !s.selectedBlockId ||
        !sorted.some((b) => b.id === s.selectedBlockId);
      let nextBlockId =
        s.selectedBlockId && sorted.some((b) => b.id === s.selectedBlockId)
          ? s.selectedBlockId
          : (sorted[0]?.id ?? null);
      let slidesInBlock =
        sorted.find((b) => b.id === nextBlockId)?.slides ?? [];
      let nextStepId =
        s.selectedStepId && slidesInBlock.some((sl) => sl.id === s.selectedStepId)
          ? s.selectedStepId
          : (slidesInBlock[0]?.id ?? null);

      if (selectionLost && !nextStepId) {
        const firstWithSlides = sorted.find((b) => (b.slides?.length ?? 0) > 0);
        if (firstWithSlides) {
          nextBlockId = firstWithSlides.id;
          slidesInBlock = firstWithSlides.slides;
          nextStepId = slidesInBlock[0]?.id ?? null;
        }
      }

      return {
        blocks: sorted,
        selectedBlockId: nextBlockId,
        selectedStepId: nextStepId,
      };
    }),
  selectSlide: (selectedBlockId, selectedStepId) =>
    set({ selectedBlockId, selectedStepId }),
  upsertSlide: (blockId, step) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id !== blockId
          ? b
          : {
              ...b,
              slides: b.slides.map((sl) => (sl.id === step.id ? step : sl)),
            },
      ),
    })),
  appendSlide: (blockId, step) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id !== blockId
          ? b
          : {
              ...b,
              slides: [...b.slides, step].sort((a, c) => a.order - c.order),
            },
      ),
      selectedBlockId: blockId,
      selectedStepId: step.id,
    })),
  removeSlide: (blockId, stepId) =>
    set((s) => {
      const blocks = s.blocks.map((b) =>
        b.id !== blockId
          ? b
          : { ...b, slides: b.slides.filter((sl) => sl.id !== stepId) },
      );
      const selectedStepId =
        s.selectedStepId === stepId
          ? (blocks.find((b) => b.id === blockId)?.slides[0]?.id ?? null)
          : s.selectedStepId;
      return { blocks, selectedStepId };
    }),
  setSlideOrderInBlock: (blockId, orderedIds) =>
    set((s) => ({
      blocks: s.blocks.map((b) => {
        if (b.id !== blockId) {
          return b;
        }
        const map = new Map(b.slides.map((sl) => [sl.id, sl]));
        const slides: LessonStep[] = [];
        orderedIds.forEach((id, order) => {
          const sl = map.get(id);
          if (sl) {
            slides.push({ ...sl, order });
          }
        });
        return { ...b, slides };
      }),
    })),
}));
