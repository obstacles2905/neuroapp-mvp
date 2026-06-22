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

export default async function SessionGreetingPage() {
  const video = await apiGet<SessionBriefingAdminVideo>(
    '/session-briefing/greeting',
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          После онбординга
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Приветствие
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Короткое представление эксперта перед «Словом Архитектора». Пользователь
          обязан просмотреть этот экран.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Видео приветствия</CardTitle>
          <CardDescription>
            Один ролик на всё приложение. Без опубликованного видео пользователь
            увидит экран ожидания и сможет продолжить только после нажатия кнопки.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionBriefingVideoEditor
            phase="greeting"
            initialVideo={video}
            mediaFolder="session-greeting"
            returnPath="/briefing/greeting"
          />
        </CardContent>
      </Card>
    </div>
  );
}
