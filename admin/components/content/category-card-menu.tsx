'use client';

import {
  deleteCategoryAction,
  demoteCategoryFromProductionAction,
  promoteCategoryToProductionAction,
} from '@/app/actions/content';
import { CategoryDeleteConfirmDialog } from '@/components/content/category-delete-confirm-dialog';
import { CategoryRenameDialog } from '@/components/content/category-rename-dialog';
import { CategoryTagsDialog } from '@/components/content/category-tags-dialog';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { cn } from '@/lib/utils';
import type { CategoryCatalogAudience, LocalizedText } from '@/lib/types/api';
import { MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const menuItemClass =
  'flex w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted/80 disabled:opacity-50';

const menuItemDeleteClass =
  'flex w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50';

type CategoryCardMenuProps = {
  categoryId: string;
  categoryLabel: string;
  catalogAudience: CategoryCatalogAudience;
  title: LocalizedText;
  tags: string[];
};

export function CategoryCardMenu({
  categoryId,
  categoryLabel,
  catalogAudience,
  title,
  tags,
}: CategoryCardMenuProps) {
  const router = useRouter();
  const { feedback, notify } = useFeedbackToast();
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isActive = catalogAudience === 'production';
  const canDelete = !isActive;
  const deleteBlockTitle = isActive
    ? 'Сначала деактивируйте категорию — удалять можно только неактивные.'
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

  function openRename() {
    setOpen(false);
    setRenameOpen(true);
  }

  function openTags() {
    setOpen(false);
    setTagsOpen(true);
  }

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
      await deleteCategoryAction(categoryId);
      setDeleteOpen(false);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Категория удалена',
        message: 'Список обновлён.',
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

  async function applyDemote() {
    await demoteCategoryFromProductionAction(categoryId);
    setOpen(false);
    router.refresh();
    notify({
      variant: 'success',
      title: 'Категория деактивирована',
      message: 'Аудитория: experimental, публикация снята.',
    });
  }

  async function applyPromote() {
    await promoteCategoryToProductionAction(categoryId);
    setOpen(false);
    router.refresh();
    notify({
      variant: 'success',
      title: 'Категория активирована',
      message:
        'Аудитория: production, ключ флага сброшен, категория опубликована.',
    });
  }

  async function toggleCatalogActive() {
    if (busy) {
      return;
    }
    if (isActive) {
      const ok = window.confirm(
        'Деактивировать категорию? Она скроется из основного каталога и станет черновиком.',
      );
      if (!ok) {
        return;
      }
    }
    setBusy(true);
    const wasActive = isActive;
    try {
      if (wasActive) {
        await applyDemote();
        return;
      }
      await applyPromote();
    } catch (e) {
      notify({
        variant: 'error',
        title: wasActive ? 'Не удалось деактивировать' : 'Не удалось активировать',
        message: e instanceof Error ? e.message : 'Попробуйте позже.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <CategoryDeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        categoryLabel={categoryLabel}
        isDeleting={deleting}
        onConfirm={() => void confirmDelete()}
      />
      <CategoryRenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        categoryId={categoryId}
        initialTitle={title}
      />
      <CategoryTagsDialog
        open={tagsOpen}
        onOpenChange={setTagsOpen}
        categoryId={categoryId}
        initialTags={tags}
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
          aria-label="Действия с категорией"
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
              className={menuItemClass}
              disabled={busy}
              onClick={openRename}
            >
              Переименовать…
            </button>
            <button
              type="button"
              role="menuitem"
              className={menuItemClass}
              disabled={busy}
              onClick={openTags}
            >
              Теги…
            </button>
            <div className="my-1 h-px bg-border/80" role="separator" />
            <button
              type="button"
              role="menuitem"
              disabled={busy}
              className={menuItemClass}
              onClick={() => void toggleCatalogActive()}
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
              Удалить категорию
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
