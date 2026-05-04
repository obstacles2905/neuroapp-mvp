'use client';

import {
  approveAccessRequestAction,
  rejectAccessRequestAction,
} from '@/app/actions/access-requests';
import { Button } from '@/components/ui/button';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type AccessRequestActionsProps = {
  requestId: string;
};

export function AccessRequestActions({ requestId }: AccessRequestActionsProps) {
  const router = useRouter();
  const { feedback, notify } = useFeedbackToast();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  async function approve() {
    setBusy('approve');
    try {
      await approveAccessRequestAction(requestId);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Заявка одобрена',
        message: 'Создан аккаунт редактора. Пользователь может войти с паролем из заявки.',
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Не удалось одобрить',
        message: e instanceof Error ? e.message : 'Попробуйте позже.',
      });
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    setBusy('reject');
    try {
      await rejectAccessRequestAction(requestId);
      router.refresh();
      notify({
        variant: 'success',
        title: 'Заявка отклонена',
        message: 'Статус заявки обновлён.',
      });
    } catch (e) {
      notify({
        variant: 'error',
        title: 'Не удалось отклонить',
        message: e instanceof Error ? e.message : 'Попробуйте позже.',
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {feedback}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={busy !== null}
          onClick={() => void approve()}
        >
          {busy === 'approve' ? '…' : 'Одобрить'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void reject()}
        >
          {busy === 'reject' ? '…' : 'Отклонить'}
        </Button>
      </div>
    </>
  );
}
