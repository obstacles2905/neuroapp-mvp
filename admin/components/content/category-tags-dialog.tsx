'use client';

import { updateCategoryTagsAction } from '@/app/actions/content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import {
  MAX_CATEGORY_TAG_LENGTH,
  MAX_CATEGORY_TAGS,
} from '@/lib/constants/category-tags';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type CategoryTagsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  initialTags: string[];
};

export function CategoryTagsDialog({
  open,
  onOpenChange,
  categoryId,
  initialTags,
}: CategoryTagsDialogProps) {
  const router = useRouter();
  const { feedback, notify } = useFeedbackToast();
  const [tags, setTags] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const tagsFingerprint = useMemo(() => initialTags.join('\u0001'), [initialTags]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTags([...initialTags]);
    setDraft('');
  }, [open, tagsFingerprint]);

  function addTag() {
    const t = draft.trim().slice(0, MAX_CATEGORY_TAG_LENGTH);
    if (!t) {
      return;
    }
    const key = t.toLowerCase();
    if (tags.some((x) => x.toLowerCase() === key)) {
      setDraft('');
      return;
    }
    if (tags.length >= MAX_CATEGORY_TAGS) {
      notify({
        variant: 'error',
        title: 'Лимит тегов',
        message: `Не больше ${MAX_CATEGORY_TAGS} тегов.`,
      });
      return;
    }
    setTags((prev) => [...prev, t]);
    setDraft('');
  }

  function removeTag(index: number) {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }

  const tagsDirty = useMemo(() => {
    if (!open) {
      return false;
    }
    if (tags.length !== initialTags.length) {
      return true;
    }
    return tags.some((t, i) => t !== initialTags[i]);
  }, [open, tags, initialTags]);

  async function save() {
    setSaving(true);
    try {
      await updateCategoryTagsAction(categoryId, tags);
      onOpenChange(false);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Теги сохранены',
        message: 'Список тегов обновлён.',
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
        aria-labelledby="category-tags-title"
        className="w-full max-w-md rounded-xl border border-border/80 bg-popover p-5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="category-tags-title" className="font-heading text-lg font-semibold text-foreground">
          Теги категории
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          До {MAX_CATEGORY_TAGS} тегов, до {MAX_CATEGORY_TAG_LENGTH} символов каждый. Дубликаты без
          учёта регистра не сохранятся.
        </p>
        <div className="mt-4 flex min-h-[2.5rem] flex-wrap gap-1.5">
          {tags.length === 0 ? (
            <span className="text-sm text-muted-foreground">Пока нет тегов</span>
          ) : (
            tags.map((t, i) => (
              <Badge
                key={`${t}-${i}`}
                variant="secondary"
                className="gap-1 pr-1 font-normal"
              >
                {t}
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-foreground/10"
                  aria-label={`Удалить тег ${t}`}
                  onClick={() => removeTag(i)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="tag-draft" className="text-xs font-medium text-muted-foreground">
              Новый тег
            </label>
            <input
              id="tag-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="input-admin w-full"
              placeholder="Например, сон"
              autoComplete="off"
            />
          </div>
          <Button type="button" variant="outline" className="shrink-0" onClick={addTag}>
            Добавить
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            type="button"
            disabled={saving || !tagsDirty}
            onClick={() => void save()}
          >
            {saving ? 'Сохранение…' : tagsDirty ? 'Сохранить' : 'Нет изменений'}
          </Button>
        </div>
      </div>
    </div>
  );
}
