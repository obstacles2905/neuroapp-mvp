import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { joinRequestAction } from '@/app/actions/auth';
import Link from 'next/link';

type PageProps = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function JoinPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const showError = searchParams.error === '1';
  const showSent = searchParams.sent === '1';

  return (
    <Card className="border-border/80 shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Заявка на доступ</CardTitle>
        <CardDescription>
          Регистрация закрыта: после отправки заявки супер-администратор сможет выдать доступ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showSent ? (
          <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Заявка отправлена. Ожидайте подтверждения.
          </p>
        ) : null}
        {showError ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Не удалось отправить (email занят или уже есть активная заявка).
          </p>
        ) : null}
        <form action={joinRequestAction} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input id="email" name="email" type="email" required className="input-admin" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Пароль (мин. 8 символов)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="input-admin"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-foreground">
              Имя (необязательно)
            </label>
            <input id="displayName" name="displayName" type="text" className="input-admin" />
          </div>
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-foreground">
              Комментарий (необязательно)
            </label>
            <textarea id="message" name="message" rows={3} className="input-admin min-h-[5.5rem]" />
          </div>
          <Button type="submit" className="w-full">
            Отправить заявку
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Уже есть доступ — войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
