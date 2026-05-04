import { LessonRemoveFromCategory } from '@/components/content/lesson-remove-from-category';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGet } from '@/lib/api/server-client';
import type { Lesson } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type PageProps = {
  searchParams: Promise<{ categoryId?: string }>;
};

export default async function LessonsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const categoryId = searchParams.categoryId;
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
  const lessons = await apiGet<Lesson[]>(`/lessons${query}`);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/content"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Категории
          </Link>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              Уроки
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {categoryId ? `Фильтр: categoryId=${categoryId}` : 'Все уроки'}
            </p>
          </div>
          <Link
            href={
              categoryId
                ? `/content/lessons/new?categoryId=${encodeURIComponent(categoryId)}`
                : '/content/lessons/new'
            }
            className={cn(buttonVariants(), 'w-full shrink-0 sm:w-auto')}
          >
            {categoryId ? 'Добавить урок в категорию' : 'Новый урок'}
          </Link>
        </div>
      </div>
      <div className="space-y-3">
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Уроков нет.</p>
        ) : (
          lessons.map((lesson) => {
            const lessonLabel = lesson.title.ru || lesson.title.en || '—';
            return (
              <Card key={lesson.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div>
                    <CardTitle className="text-base">{lessonLabel}</CardTitle>
                    <CardDescription className="font-mono text-xs">id: {lesson.id}</CardDescription>
                  </div>
                  <Badge variant={lesson.status === 'published' ? 'default' : 'secondary'}>
                    {lesson.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/content/lessons/${lesson.id}/builder`}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Конструктор шагов →
                  </Link>
                  <LessonRemoveFromCategory
                    lessonId={lesson.id}
                    lessonLabel={lessonLabel}
                    status={lesson.status}
                  />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
