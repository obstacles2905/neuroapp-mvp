'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  AnimationStepContent,
  BiometricsStepContent,
  LessonStep,
  PracticeStepContent,
  TheoryStepContent,
  VideoStepContent,
} from '@/lib/types/lesson-step';
import { LESSON_STEP_LABELS } from '@/lib/types/lesson-step';
import { cn } from '@/lib/utils';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

function stepPreview(step: LessonStep): string {
  switch (step.type) {
    case 'theory': {
      const c = step.content as TheoryStepContent;
      const s = c.sentences;
      const first = s.ru[0] ?? s.uk[0] ?? s.en[0] ?? '';
      return first || 'Пустая теория';
    }
    case 'video': {
      const c = step.content as VideoStepContent;
      return c.title.ru || c.title.uk || c.title.en || 'Видео';
    }
    case 'animation': {
      const c = step.content as AnimationStepContent;
      return (
        c.description.ru || c.description.uk || c.description.en || 'Анимация'
      );
    }
    case 'practice': {
      const c = step.content as PracticeStepContent;
      return (
        c.instruction.ru ||
        c.instruction.uk ||
        c.instruction.en ||
        `Практика · ${c.duration_seconds}s`
      );
    }
    case 'biometrics': {
      const c = step.content as BiometricsStepContent;
      return `Биометрия · ${c.phase} · ${c.metric}`;
    }
    default:
      return '';
  }
}

function SortableRow({
  step,
  selected,
  onSelect,
}: {
  step: LessonStep;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'flex w-full items-stretch gap-0 rounded-xl border bg-card text-left shadow-sm transition-[box-shadow,opacity]',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border/80 hover:border-border',
        isDragging && 'opacity-70',
      )}
    >
      <span
        className="flex cursor-grab touch-none items-center border-r border-border/60 bg-muted/40 px-2 text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Перетащить"
      >
        <GripVertical className="size-4" />
      </span>
      <span className="min-w-0 flex-1 px-3 py-3">
        <span className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[0.65rem]">
            {LESSON_STEP_LABELS[step.type]}
          </Badge>
          <span className="text-xs text-muted-foreground">#{step.order + 1}</span>
        </span>
        <span className="mt-1 line-clamp-2 block text-sm text-foreground">
          {stepPreview(step)}
        </span>
      </span>
    </button>
  );
}

type SortableStepListProps = {
  steps: LessonStep[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  listTitle?: string;
  emptyHint?: string;
};

export function SortableStepList({
  steps,
  selectedId,
  onSelect,
  onReorder,
  listTitle = 'Слайды',
  emptyHint = 'Добавьте первый слайд ниже.',
}: SortableStepListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const next = arrayMove(steps, oldIndex, newIndex);
    onReorder(next.map((s) => s.id));
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base">{listTitle}</CardTitle>
        <p className="text-xs font-normal text-muted-foreground">
          Клик по слайду открывает поля редактирования в колонке справа на широком экране; на узком —
          прокрутите страницу ниже блоков.
        </p>
      </CardHeader>
      <CardContent>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-2">
                {steps.map((step) => (
                  <li key={step.id}>
                    <SortableRow
                      step={step}
                      selected={step.id === selectedId}
                      onSelect={() => onSelect(step.id)}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
