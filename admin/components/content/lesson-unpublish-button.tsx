'use client';

import { unpublishLessonAction } from '@/app/actions/lesson-steps';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type LessonUnpublishButtonProps = {
  lessonId: string;
  status: 'draft' | 'published';
};

export function LessonUnpublishButton({
  lessonId,
  status,
}: LessonUnpublishButtonProps) {
  const router = useRouter();
  const { feedback, notify } = useFeedbackToast();
  const [busy, setBusy] = useState(false);

  if (status !== 'published') {
    return null;
  }

  async function onUnpublish() {
    setBusy(true);
    const result = await unpublishLessonAction(lessonId);
    setBusy(false);
    if (result.ok) {
      router.refresh();
      notify({
        variant: 'success',
        title: 'Урок снят с публикации',
        message: 'Теперь урок в черновике — его можно удалить.',
      });
      return;
    }
    notify({
      variant: 'error',
      title: 'Не удалось снять с публикацию',
      message: result.message,
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {feedback}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => void onUnpublish()}
      >
        {busy ? 'Снятие…' : 'Снять с публикации'}
      </Button>
    </div>
  );
}
