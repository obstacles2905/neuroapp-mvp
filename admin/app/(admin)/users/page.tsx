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
import type { AppUserSummary } from '@/lib/types/api';
import Link from 'next/link';

export default async function UsersPage() {
  const users = await apiGet<AppUserSummary[]>('/analytics/users');

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Users</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Пользователи мобильного приложения и агрегированный прогресс по урокам.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">App users</CardTitle>
          <CardDescription>
            Данные из <code className="text-xs">GET /analytics/users</code>. Пустая таблица — в БД ещё нет
            записей в <code className="text-xs">app_users</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-zinc-500">Нет пользователей для отображения.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя / email</TableHead>
                  <TableHead className="text-right">Завершено</TableHead>
                  <TableHead className="text-right">В процессе</TableHead>
                  <TableHead>Активность</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium text-zinc-900">
                        {u.displayName || u.email || '—'}
                      </div>
                      {u.email && u.displayName ? (
                        <div className="text-xs text-zinc-500">{u.email}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{u.lessonsCompleted}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{u.lessonsInProgress}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {u.lastActiveAt
                        ? new Date(u.lastActiveAt).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/users/${u.id}`}
                        className="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline"
                      >
                        Детали
                      </Link>
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
