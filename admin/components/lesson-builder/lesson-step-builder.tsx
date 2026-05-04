'use client';

import {
  createLessonStepAction,
  publishLessonAction,
  reorderLessonStepsAction,
} from '@/app/actions/lesson-steps';
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
import type { LessonBlock } from '@/lib/types/api';
import type { LessonWithBlocks } from '@/lib/types/api';
import type { LessonStepType } from '@/lib/types/lesson-step';
import {
  LESSON_STEP_LABELS,
  LESSON_STEP_TYPES,
} from '@/lib/types/lesson-step';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type LessonStepBuilderProps = {
  lessonId: string;
  initialLesson: LessonWithBlocks;
};

function BlockSection({
  block,
  lessonId,
  selectedStepId,
  onSelectSlide,
  onReorder,
  notify,
}: {
  block: LessonBlock;
  lessonId: string;
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
      const created = await createLessonStepAction(lessonId, block.id, addType);
      appendSlide(block.id, created);
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
        listTitle="Слайды в блоке"
        emptyHint="Пока нет слайдов — добавьте первый ниже."
      />
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 space-y-1">
          <label
            htmlFor={`add-type-${block.id}`}
            className="text-xs font-medium text-muted-foreground"
          >
            Тип нового слайда
          </label>
          <select
            id={`add-type-${block.id}`}
            className="input-admin max-w-md"
            value={addType}
            onChange={(e) => setAddType(e.target.value as LessonStepType)}
          >
            {LESSON_STEP_TYPES.map((t) => (
              <option key={t} value={t}>
                {LESSON_STEP_LABELS[t]}
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

export function LessonStepBuilder({ lessonId, initialLesson }: LessonStepBuilderProps) {
  const router = useRouter();
  const blocks = useLessonBuilderStore((s) => s.blocks);
  const selectedBlockId = useLessonBuilderStore((s) => s.selectedBlockId);
  const selectedStepId = useLessonBuilderStore((s) => s.selectedStepId);
  const selectSlide = useLessonBuilderStore((s) => s.selectSlide);
  const setBlocks = useLessonBuilderStore((s) => s.setBlocks);
  const setSlideOrderInBlock = useLessonBuilderStore((s) => s.setSlideOrderInBlock);

  const [publishing, setPublishing] = useState(false);
  const { feedback, notify } = useFeedbackToast();

  useEffect(() => {
    setBlocks(initialLesson.blocks ?? []);
  }, [initialLesson.blocks, setBlocks]);

  const selectedStep =
    blocks
      .find((b) => b.id === selectedBlockId)
      ?.slides.find((s) => s.id === selectedStepId) ?? null;

  const title =
    initialLesson.title.ru ||
    initialLesson.title.uk ||
    initialLesson.title.en ||
    'Урок';

  async function onReorderBlock(blockId: string, orderedIds: string[]) {
    setSlideOrderInBlock(blockId, orderedIds);
    const items = orderedIds.map((id, order) => ({ id, order }));
    try {
      await reorderLessonStepsAction(lessonId, blockId, items);
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

  async function onPublish() {
    setPublishing(true);
    const result = await publishLessonAction(lessonId);
    setPublishing(false);
    if (result.ok) {
      router.refresh();
      notify({
        variant: 'success',
        title: 'Урок опубликован',
        message: 'Статус урока обновлён. Проверьте контент в приложении.',
      });
      return;
    }
    notify({
      variant: 'error',
      title: 'Публикация не удалась',
      message: result.message,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {feedback}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/content/lessons?categoryId=${encodeURIComponent(initialLesson.categoryId)}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Уроки
            </Link>
            <Badge variant={initialLesson.status === 'published' ? 'default' : 'secondary'}>
              {initialLesson.status === 'published' ? 'Опубликован' : 'Черновик'}
            </Badge>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Урок из пяти блоков. В каждом блоке — несколько слайдов (теория, видео и т.д.).{' '}
            <span className="text-foreground/90">
              Нажмите на строку слайда, чтобы открыть редактор справа (сохранение и удаление — там же).
            </span>{' '}
            Порядок меняется перетаскиванием за иконку «⋮⋮» слева от слайда.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={publishing}
            onClick={() => void onPublish()}
          >
            {publishing ? 'Публикация…' : 'Опубликовать урок'}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:items-start">
        <div className="space-y-8">
          {blocks.map((block) => (
            <BlockSection
              key={block.id}
              block={block}
              lessonId={lessonId}
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
            lessonId={lessonId}
            blockId={selectedBlockId}
            step={selectedStep}
          />
        </div>
      </div>
    </div>
  );
}
