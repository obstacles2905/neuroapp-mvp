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
import { formatMinutes, formatMs } from '@/lib/format-usage';
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
          <CardTitle className="text-base">MND-прогресс</CardTitle>
          <CardDescription>
            Уникальные завершённые MND-упражнения из{' '}
            <code className="text-xs">app_user_mnd_exercise_completions</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="text-base">
            {user.mndExercisesCompleted} завершено
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Время в приложении</CardTitle>
          <CardDescription>
            Дни в часовом поясе пользователя
            {user.usageTimezone ? ` (${user.usageTimezone})` : ' (UTC, пока нет данных с устройства)'}
            . «Упражнения» — экраны MND.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-zinc-500">В приложении</dt>
              <dd className="font-medium text-zinc-900">
                {formatMinutes(user.totalAppMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">На упражнениях</dt>
              <dd className="font-medium text-zinc-900">
                {formatMinutes(user.totalExerciseMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Прочее в приложении</dt>
              <dd className="font-medium text-zinc-900">
                {formatMinutes(user.totalPassiveMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Последний визит</dt>
              <dd className="font-medium text-zinc-900">
                {user.lastSeenAt
                  ? new Date(user.lastSeenAt).toLocaleString()
                  : '—'}
              </dd>
            </div>
          </dl>
          {user.usageByDay.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Пока нет отправленных интервалов с мобильного клиента.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>День</TableHead>
                  <TableHead className="text-right">В приложении</TableHead>
                  <TableHead className="text-right">Упражнения</TableHead>
                  <TableHead className="text-right">Визиты</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.usageByDay.map((row) => (
                  <TableRow key={row.localDay}>
                    <TableCell>{row.localDay}</TableCell>
                    <TableCell className="text-right">{formatMs(row.appMs)}</TableCell>
                    <TableCell className="text-right">
                      {formatMs(row.exerciseMs)}
                    </TableCell>
                    <TableCell className="text-right">{row.sessionCount}</TableCell>
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
