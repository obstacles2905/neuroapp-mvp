'use client';

import {
  createMndExerciseStepAction,
  deleteMndExerciseStepAction,
  reorderMndExerciseStepsAction,
  updateMndExercisePublishedAction,
  updateMndExerciseStepAction,
} from '@/app/actions/mnd';
import { SortableStepList } from '@/components/lesson-builder/sortable-step-list';
import { StepEditorPanel } from '@/components/lesson-builder/step-editor-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeedbackToast, type FeedbackPayload } from '@/components/ui/feedback-toast';
import {
  LESSON_BLOCK_HINTS,
  LESSON_BLOCK_TITLES,
} from '@/lib/lesson-content-blocks';
import { useLessonBuilderStore } from '@/lib/stores/lesson-builder-store';
import type { LessonBlock, MndExercise } from '@/lib/types/api';
import type { LessonStepType } from '@/lib/types/lesson-step';
import {
  LESSON_STEP_LABELS,
  LESSON_STEP_TYPES,
} from '@/lib/types/lesson-step';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type MndExerciseBuilderProps = {
  initialExercise: MndExercise;
};

function toBuilderBlocks(exercise: MndExercise): LessonBlock[] {
  return (exercise.blocks ?? []).map((block) => ({
    id: block.id,
    lessonId: exercise.id,
    blockType: block.blockType,
    order: block.order,
    slides: (block.slides ?? []).map((slide) => ({
      ...slide,
      lessonBlockId: block.id,
    })),
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  }));
}

function exerciseTitle(exercise: MndExercise): string {
  return exercise.title.ru || exercise.title.uk || exercise.title.en || 'Упражнение';
}

function directionLabel(direction: MndExercise['direction']): string {
  return direction === 'bottom_up' ? 'Bottom-Up' : 'Top-Down';
}

function BlockSection({
  block,
  exerciseId,
  selectedStepId,
  onSelectSlide,
  onReorder,
  notify,
}: {
  block: LessonBlock;
  exerciseId: string;
  selectedStepId: string | null;
  onSelectSlide: (stepId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  notify: (payload: FeedbackPayload) => void;
}) {
  const [addType, setAddType] = useState<LessonStepType>('theory');
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const appendSlide = useLessonBuilderStore((s) => s.appendSlide);

  async function handleAdd() {
    setAdding(true);
    try {
      const created = await createMndExerciseStepAction(exerciseId, block.id, addType);
      const createdForBuilder = { ...created, lessonBlockId: block.id };
      appendSlide(block.id, createdForBuilder);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Слайд добавлен',
        message: `В блок «${LESSON_BLOCK_TITLES[block.blockType]}» — тип «${LESSON_STEP_LABELS[addType]}».`,
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Не удалось добавить слайд',
        message: e instanceof Error ? e.message : 'Попробуйте ещё раз.',
      });
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm ring-1 ring-border/40">
      <div className="mb-3">
        <h2 className="font-heading text-base font-semibold text-foreground">
          {LESSON_BLOCK_TITLES[block.blockType]}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {LESSON_BLOCK_HINTS[block.blockType]}
        </p>
      </div>
      <SortableStepList
        steps={block.slides}
        selectedId={selectedStepId}
        onSelect={onSelectSlide}
        onReorder={onReorder}
        listTitle="Слайды упражнения"
        emptyHint="Пока нет слайдов — добавьте первый ниже."
      />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor={`add-type-${block.id}`} className="text-xs font-medium text-muted-foreground">
            Тип нового слайда
          </label>
          <select
            id={`add-type-${block.id}`}
            className="input-admin max-w-md"
            value={addType}
            onChange={(event) => setAddType(event.target.value as LessonStepType)}
          >
            {LESSON_STEP_TYPES.map((type) => (
              <option key={type} value={type}>
                {LESSON_STEP_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" disabled={adding} onClick={() => void handleAdd()}>
          {adding ? 'Добавление…' : 'Добавить слайд'}
        </Button>
      </div>
    </section>
  );
}

export function MndExerciseBuilder({ initialExercise }: MndExerciseBuilderProps) {
  const router = useRouter();
  const initialBlocks = useMemo(() => toBuilderBlocks(initialExercise), [initialExercise]);
  const blocks = useLessonBuilderStore((s) => s.blocks);
  const selectedBlockId = useLessonBuilderStore((s) => s.selectedBlockId);
  const selectedStepId = useLessonBuilderStore((s) => s.selectedStepId);
  const selectSlide = useLessonBuilderStore((s) => s.selectSlide);
  const setBlocks = useLessonBuilderStore((s) => s.setBlocks);
  const setSlideOrderInBlock = useLessonBuilderStore((s) => s.setSlideOrderInBlock);

  const [publishing, setPublishing] = useState(false);
  const { feedback, notify } = useFeedbackToast();

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks, setBlocks]);

  const selectedStep =
    blocks
      .find((block) => block.id === selectedBlockId)
      ?.slides.find((slide) => slide.id === selectedStepId) ?? null;

  async function onReorderBlock(blockId: string, orderedIds: string[]) {
    setSlideOrderInBlock(blockId, orderedIds);
    const items = orderedIds.map((id, order) => ({ id, order }));
    try {
      await reorderMndExerciseStepsAction(initialExercise.id, blockId, items);
      router.refresh();
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Порядок не сохранён',
        message:
          e instanceof Error
            ? e.message
            : 'Не удалось сохранить порядок слайдов. Страница будет обновлена.',
      });
      router.refresh();
    }
  }

  async function onTogglePublish() {
    setPublishing(true);
    try {
      await updateMndExercisePublishedAction(initialExercise.id, !initialExercise.isPublished);
      router.refresh();
      notify({
        variant: 'success',
        title: initialExercise.isPublished ? 'Упражнение снято с публикации' : 'Упражнение опубликовано',
        message: 'Статус упражнения обновлён.',
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Статус не обновлён',
        message: e instanceof Error ? e.message : 'Попробуйте ещё раз.',
      });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {feedback}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/mnd" className="text-sm text-muted-foreground hover:text-foreground">
              ← MND Protocol
            </Link>
            <Badge variant={initialExercise.isPublished ? 'default' : 'secondary'}>
              {initialExercise.isPublished ? 'Опубликовано' : 'Черновик'}
            </Badge>
            <Badge variant="outline">{directionLabel(initialExercise.direction)}</Badge>
            <Badge variant="outline">L{initialExercise.complexityLevel}</Badge>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {exerciseTitle(initialExercise)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Конструктор упражнения использует те же слайды, видео, анимации и практические блоки, что
            прежний lesson builder, но упражнение остаётся частью MND-стека.
          </p>
        </div>
        <Button type="button" disabled={publishing} onClick={() => void onTogglePublish()}>
          {publishing
            ? 'Обновление…'
            : initialExercise.isPublished
              ? 'Снять с публикации'
              : 'Опубликовать упражнение'}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:items-start">
        <div className="space-y-8">
          {blocks.map((block) => (
            <BlockSection
              key={block.id}
              block={block}
              exerciseId={initialExercise.id}
              selectedStepId={selectedBlockId === block.id ? selectedStepId : null}
              onSelectSlide={(stepId) => selectSlide(block.id, stepId)}
              onReorder={(ids) => void onReorderBlock(block.id, ids)}
              notify={notify}
            />
          ))}
        </div>
        <div className="lg:sticky lg:top-6">
          <StepEditorPanel
            key={selectedStep?.id ?? 'no-step'}
            lessonId={initialExercise.id}
            blockId={selectedBlockId}
            step={selectedStep}
            updateStep={updateMndExerciseStepAction}
            deleteStep={deleteMndExerciseStepAction}
          />
        </div>
      </div>
    </div>
  );
}
