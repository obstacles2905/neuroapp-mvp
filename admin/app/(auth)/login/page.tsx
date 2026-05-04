import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loginAction } from '@/app/actions/auth';
import Link from 'next/link';

type PageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const showError = searchParams.error === '1';

  return (
    <Card className="border-border/80 shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Вход</CardTitle>
        <CardDescription>
          NeuroSync Admin. Нет аккаунта?{' '}
          <Link href="/join" className="font-medium text-primary underline-offset-4 hover:underline">
            Подать заявку
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showError ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Неверный email или пароль.
          </p>
        ) : null}
        <form action={loginAction} className="flex flex-col gap-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input-admin"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              className="input-admin"
            />
          </div>
          <Button type="submit" className="w-full">
            Войти
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
