import { SessionBriefingVideoEditor } from '@/components/briefing/session-briefing-video-editor';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiGet } from '@/lib/api/server-client';
import type { SessionBriefingAdminVideo } from '@/lib/types/session-briefing';

export default async function SessionFinalWordPage() {
  const video = await apiGet<SessionBriefingAdminVideo>(
    '/session-briefing/final-word',
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          После «Слова Архитектора»
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Финальное слово
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Заключительное обращение эксперта перед входом в основное приложение.
          Пользователь обязан пройти этот экран.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Видео финального слова</CardTitle>
          <CardDescription>
            Один ролик на всё приложение. Показывается после просмотра «Слова
            Архитектора».
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionBriefingVideoEditor
            phase="final-word"
            initialVideo={video}
            mediaFolder="session-final-word"
            returnPath="/briefing/final-word"
          />
        </CardContent>
      </Card>
    </div>
  );
}
