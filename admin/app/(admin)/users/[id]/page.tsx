import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiGet } from '@/lib/api/server-client';
import type { AppUserDetail } from '@/lib/types/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage(props: PageProps) {
  const { id } = await props.params;
  let user: AppUserDetail;
  try {
    user = await apiGet<AppUserDetail>(`/analytics/users/${id}`);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link href="/users" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Все пользователи
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
          {user.displayName || user.email || 'Пользователь'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {user.email ? user.email : null} · создан{' '}
          {new Date(user.createdAt).toLocaleString()}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Прогресс по урокам</CardTitle>
          <CardDescription>Записи из user_lesson_progress</CardDescription>
        </CardHeader>
        <CardContent>
          {user.progress.length === 0 ? (
            <p className="text-sm text-zinc-500">Нет данных о прогрессе.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Урок</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Активность</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.progress.map((row) => (
                  <TableRow key={`${user.id}-${row.lessonId}`}>
                    <TableCell>
                      {row.lessonTitle.ru || row.lessonTitle.en || row.lessonId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.percentComplete}</TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {row.lastActiveAt
                        ? new Date(row.lastActiveAt).toLocaleString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
