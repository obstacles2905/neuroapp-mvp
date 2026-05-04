import { AccessRequestActions } from '@/components/settings/access-request-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '@/lib/api/server-client';
import { getMe } from '@/lib/auth/session';
import type { AccessRequestRow } from '@/lib/types/access-request';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AccessRequestsPage() {
  const me = await getMe();
  if (me?.role !== 'super_admin') {
    redirect('/dashboard');
  }
  const rows = await apiGet<AccessRequestRow[]>('/access-requests');

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
          Заявки на доступ
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Одобрение создаёт аккаунт с ролью content editor (пароль — тот, что указан в заявке).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ожидают решения</CardTitle>
          <CardDescription>GET /access-requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {rows.length === 0 ? (
            <p className="text-sm text-zinc-500">Нет заявок в статусе pending.</p>
          ) : (
            rows.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-900">{row.email}</p>
                  {row.displayName ? (
                    <p className="text-sm text-zinc-600">{row.displayName}</p>
                  ) : null}
                  {row.message ? (
                    <p className="mt-2 text-sm text-zinc-600">{row.message}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-zinc-400">
                    {new Date(row.createdAt).toLocaleString()}
                  </p>
                </div>
                <AccessRequestActions requestId={row.id} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
