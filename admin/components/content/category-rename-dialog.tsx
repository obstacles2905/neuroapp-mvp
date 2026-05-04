'use client';

import { updateCategoryTitleAction } from '@/app/actions/content';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import type { LocalizedText } from '@/lib/types/api';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type CategoryRenameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  initialTitle: LocalizedText;
};

export function CategoryRenameDialog({
  open,
  onOpenChange,
  categoryId,
  initialTitle,
}: CategoryRenameDialogProps) {
  const router = useRouter();
  const { feedback, notify } = useFeedbackToast();
  const [ru, setRu] = useState('');
  const [uk, setUk] = useState('');
  const [en, setEn] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setRu(initialTitle.ru);
    setUk(initialTitle.uk);
    setEn(initialTitle.en);
  }, [open, initialTitle.ru, initialTitle.uk, initialTitle.en]);

  const isDirty = useMemo(() => {
    if (!open) {
      return false;
    }
    return (
      ru !== (initialTitle.ru ?? '') ||
      uk !== (initialTitle.uk ?? '') ||
      en !== (initialTitle.en ?? '')
    );
  }, [open, ru, uk, en, initialTitle.ru, initialTitle.uk, initialTitle.en]);

  async function save() {
    setSaving(true);
    try {
      await updateCategoryTitleAction(categoryId, { ru, uk, en });
      onOpenChange(false);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Название сохранено',
        message: 'Категория обновлена.',
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Не удалось сохранить',
        message: e instanceof Error ? e.message : 'Попробуйте позже.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      {feedback}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-rename-title"
        className="w-full max-w-md rounded-xl border border-border/80 bg-popover p-5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="category-rename-title" className="font-heading text-lg font-semibold text-foreground">
          Переименовать категорию
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Название на трёх языках (как в приложении).
        </p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <label htmlFor="rename-ru" className="text-xs font-medium text-muted-foreground">
              RU
            </label>
            <input
              id="rename-ru"
              value={ru}
              onChange={(e) => setRu(e.target.value)}
              className="input-admin w-full"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="rename-uk" className="text-xs font-medium text-muted-foreground">
              UK
            </label>
            <input
              id="rename-uk"
              value={uk}
              onChange={(e) => setUk(e.target.value)}
              className="input-admin w-full"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="rename-en" className="text-xs font-medium text-muted-foreground">
              EN
            </label>
            <input
              id="rename-en"
              value={en}
              onChange={(e) => setEn(e.target.value)}
              className="input-admin w-full"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            type="button"
            disabled={saving || !isDirty}
            onClick={() => void save()}
          >
            {saving ? 'Сохранение…' : isDirty ? 'Сохранить' : 'Нет изменений'}
          </Button>
        </div>
      </div>
    </div>
  );
}
