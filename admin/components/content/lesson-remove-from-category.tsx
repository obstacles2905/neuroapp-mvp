'use client';

import { deleteLessonAction } from '@/app/actions/content';
import { LessonDeleteConfirmDialog } from '@/components/content/lesson-delete-confirm-dialog';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type LessonRemoveFromCategoryProps = {
  lessonId: string;
  lessonLabel: string;
  status: 'draft' | 'published';
};

export function LessonRemoveFromCategory({
  lessonId,
  lessonLabel,
  status,
}: LessonRemoveFromCategoryProps) {
  const router = useRouter();
  const { feedback, notify } = useFeedbackToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const canRemove = status === 'draft';
  const blockTitle = canRemove
    ? undefined
    : 'Сначала снимите урок с публикации — удалять можно только черновики.';

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteLessonAction(lessonId);
      setDialogOpen(false);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Урок удалён',
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

  return (
    <>
      <LessonDeleteConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lessonLabel={lessonLabel}
        isDeleting={deleting}
        onConfirm={() => void confirmDelete()}
      />
      <div className="flex flex-wrap items-center gap-2">
        {feedback}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={!canRemove}
          title={blockTitle}
          onClick={() => {
            if (canRemove) {
              setDialogOpen(true);
            }
          }}
        >
          Удалить из категории
        </Button>
      </div>
    </>
  );
}
