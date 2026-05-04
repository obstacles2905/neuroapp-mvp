import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Обзор NeuroSync: контент и пользователи приложения подключаются к Admin API.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Builder</CardTitle>
            <CardDescription>Категории и уроки CMS</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/content"
              className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline"
            >
              Перейти к контенту →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
            <CardDescription>App-пользователи и прогресс по урокам</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/users"
              className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline"
            >
              Открыть аналитику →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
