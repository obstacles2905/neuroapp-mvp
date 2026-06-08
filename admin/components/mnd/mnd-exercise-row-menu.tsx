'use client';

import {
  deleteMndExerciseAction,
  updateMndExercisePublishedAction,
} from '@/app/actions/mnd';
import { MndExerciseDeleteConfirmDialog } from '@/components/mnd/mnd-exercise-delete-confirm-dialog';
import { AnchoredMenuPanel } from '@/components/ui/anchored-menu-panel';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const menuItemClass =
  'flex w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/80 disabled:opacity-50';

const menuItemDeleteClass =
  'flex w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50';

type MndExerciseRowMenuProps = {
  exerciseId: string;
  exerciseLabel: string;
  isPublished: boolean;
};

export function MndExerciseRowMenu({
  exerciseId,
  exerciseLabel,
  isPublished,
}: MndExerciseRowMenuProps) {
  const router = useRouter();
  const { feedback, notify } = useFeedbackToast();
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const canDelete = !isPublished;
  const deleteBlockTitle = isPublished
    ? 'Сначала деактивируйте упражнение — удалять можно только черновики.'
    : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function openDelete() {
    if (!canDelete) {
      return;
    }
    setOpen(false);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteMndExerciseAction(exerciseId);
      setDeleteOpen(false);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Упражнение удалено',
        message: 'Упражнение и все слайды удалены безвозвратно.',
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Не удалось удалить',
        message: e instanceof Error ? e.message : 'Попробуйте позже.',
      });
    } finally {
      setDeleting(false);
    }
  }

  async function applyDeactivate() {
    try {
      await updateMndExercisePublishedAction(exerciseId, false);
      setOpen(false);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Упражнение деактивировано',
        message: 'Упражнение переведено в черновик — его можно удалить.',
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Не удалось деактивировать',
        message: e instanceof Error ? e.message : 'Попробуйте позже.',
      });
    }
  }

  async function applyActivate() {
    try {
      await updateMndExercisePublishedAction(exerciseId, true);
      setOpen(false);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Упражнение активировано',
        message: 'Упражнение опубликовано и доступно в приложении.',
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Не удалось активировать',
        message: e instanceof Error ? e.message : 'Попробуйте позже.',
      });
    }
  }

  async function toggleActive() {
    if (busy) {
      return;
    }
    if (isPublished) {
      const ok = window.confirm(
        'Деактивировать упражнение? Оно скроется из приложения и станет черновиком.',
      );
      if (!ok) {
        return;
      }
    }
    setBusy(true);
    try {
      if (isPublished) {
        await applyDeactivate();
        return;
      }
      await applyActivate();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <MndExerciseDeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        exerciseLabel={exerciseLabel}
        isDeleting={deleting}
        onConfirm={() => void confirmDelete()}
      />
      <div ref={anchorRef} className="relative flex flex-wrap items-center gap-2">
        {feedback}
        <Link
          href={`/mnd/exercises/${exerciseId}/builder`}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Конструктор
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          disabled={busy}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Действия с упражнением"
          onClick={() => setOpen((value) => !value)}
        >
          <MoreVertical className="size-4" />
        </Button>
        <AnchoredMenuPanel open={open} anchorRef={anchorRef} menuRef={menuRef}>
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            className={menuItemClass}
            onClick={() => void toggleActive()}
          >
            {isPublished ? 'Деактивировать' : 'Активировать'}
          </button>
          <div className="my-1 h-px bg-border/80" role="separator" />
          <button
            type="button"
            role="menuitem"
            disabled={busy || !canDelete}
            title={deleteBlockTitle}
            className={menuItemDeleteClass}
            onClick={openDelete}
          >
            Удалить упражнение
          </button>
        </AnchoredMenuPanel>
      </div>
    </>
  );
}
