'use client';

import { deleteLessonAction } from '@/app/actions/content';
import {
  publishLessonAction,
  unpublishLessonAction,
} from '@/app/actions/lesson-steps';
import { LessonDeleteConfirmDialog } from '@/components/content/lesson-delete-confirm-dialog';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const menuItemClass =
  'flex w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/80 disabled:opacity-50';

const menuItemDeleteClass =
  'flex w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50';

type LessonCardMenuProps = {
  lessonId: string;
  lessonLabel: string;
  status: 'draft' | 'published';
};

export function LessonCardMenu({
  lessonId,
  lessonLabel,
  status,
}: LessonCardMenuProps) {
  const router = useRouter();
  const { feedback, notify } = useFeedbackToast();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isActive = status === 'published';
  const canDelete = !isActive;
  const deleteBlockTitle = isActive
    ? 'Сначала деактивируйте урок — удалять можно только черновики.'
    : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current?.contains(e.target as Node)) {
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
      await deleteLessonAction(lessonId);
      setDeleteOpen(false);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Урок удалён',
        message: 'Урок и все шаги удалены безвозвратно.',
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
    const result = await unpublishLessonAction(lessonId);
    setOpen(false);
    if (!result.ok) {
      notify({
        variant: 'error',
        title: 'Не удалось деактивировать',
        message: result.message,
      });
      return;
    }
    router.refresh();
    notify({
      variant: 'success',
      title: 'Урок деактивирован',
      message: 'Урок переведён в черновик — его можно удалить.',
    });
  }

  async function applyActivate() {
    const result = await publishLessonAction(lessonId);
    setOpen(false);
    if (!result.ok) {
      notify({
        variant: 'error',
        title: 'Не удалось активировать',
        message: result.message,
      });
      return;
    }
    router.refresh();
    notify({
      variant: 'success',
      title: 'Урок активирован',
      message: 'Урок опубликован и доступен в приложении.',
    });
  }

  async function toggleActive() {
    if (busy) {
      return;
    }
    if (isActive) {
      const ok = window.confirm(
        'Деактивировать урок? Он скроется из приложения и станет черновиком.',
      );
      if (!ok) {
        return;
      }
    }
    setBusy(true);
    const wasActive = isActive;
    try {
      if (wasActive) {
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
      <LessonDeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        lessonLabel={lessonLabel}
        isDeleting={deleting}
        onConfirm={() => void confirmDelete()}
      />
      <div
        ref={wrapRef}
        className={cn('relative shrink-0', open && 'z-[100]')}
      >
        {feedback}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          disabled={busy}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Действия с уроком"
          onClick={() => setOpen((v) => !v)}
        >
          <MoreVertical className="size-4" />
        </Button>
        {open ? (
          <div
            role="menu"
            className={cn(
              'absolute right-0 top-full z-[101] mt-1 min-w-[14rem] rounded-lg border border-border/80 bg-popover py-1 shadow-md',
            )}
          >
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              className={menuItemClass}
              onClick={() => void toggleActive()}
            >
              {isActive ? 'Деактивировать' : 'Активировать'}
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
              Удалить урок
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
