import { createLessonAction } from '@/app/actions/content';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '@/lib/api/server-client';
import type { Category } from '@/lib/types/api';
import Link from 'next/link';

type PageProps = {
  searchParams: Promise<{ categoryId?: string }>;
};

export default async function NewLessonPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const defaultCategoryId = searchParams.categoryId ?? '';
  const categories = await apiGet<Category[]>('/categories');

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/content" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Категории
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">Новый урок</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Черновик урока</CardTitle>
          <CardDescription>Статус будет draft; опубликовать можно позже через API.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createLessonAction} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="categoryId" className="text-sm font-medium text-zinc-700">
                Категория
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                defaultValue={defaultCategoryId}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">— выберите —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title.ru || c.title.en} ({c.id.slice(0, 8)}…)
                  </option>
                ))}
              </select>
            </div>
            <fieldset className="space-y-3 rounded-lg border border-zinc-200 p-4">
              <legend className="px-1 text-sm font-medium text-zinc-800">Название урока</legend>
              {(['ru', 'uk', 'en'] as const).map((loc) => (
                <div key={loc} className="space-y-1">
                  <label htmlFor={`title_${loc}`} className="text-xs font-medium text-zinc-600">
                    {loc.toUpperCase()}
                  </label>
                  <input
                    id={`title_${loc}`}
                    name={`title_${loc}`}
                    type="text"
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </fieldset>
            <div className="space-y-2">
              <label htmlFor="order" className="text-sm font-medium text-zinc-700">
                Порядок в категории
              </label>
              <input
                id="order"
                name="order"
                type="number"
                min={0}
                defaultValue={0}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Создать</Button>
              <Link
                href="/content"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                Отмена
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
