'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useId } from 'react';

type CategoryDeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryLabel: string;
  isDeleting: boolean;
  onConfirm: () => void;
};

export function CategoryDeleteConfirmDialog({
  open,
  onOpenChange,
  categoryLabel,
  isDeleting,
  onConfirm,
}: CategoryDeleteConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onOpenChange(false);
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md rounded-xl border border-border/80 bg-popover p-5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="font-heading text-lg font-semibold text-destructive"
        >
          Удалить категорию
        </h2>
        <p id={descId} className="mt-1 text-sm text-muted-foreground">
          Удалить категорию «{categoryLabel}»? Это действие необратимо. Все уроки этой
          категории будут удалены вместе с ней. Вы уверены?
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? 'Удаление…' : 'Удалить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
